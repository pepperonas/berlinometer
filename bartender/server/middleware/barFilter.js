/**
 * Middleware und Hilfsmodule für Bar-Datenfilterung
 */

/**
 * Fügt Bar-ID zu einer Mongoose-Abfrage hinzu
 * @param {Object} req - Express Request-Objekt
 * @param {Object} query - Mongoose-Query-Objekt
 * @returns {Object} Mongoose-Query mit Bar-Filter
 */
const addBarFilter = (req, query) => {
  if (req.barId) {
    query.bar = req.barId;
  }
  return query;
};

/**
 * Fügt Bar-ID zu einem Request Body hinzu (für neue Dokumente)
 * @param {Object} req - Express Request-Objekt
 * @returns {Object} Express Request-Objekt mit aktualisiertem Body
 */
const addBarToBody = (req, res, next) => {
  if (req.barId) {
    req.body.bar = req.barId;
    console.log('Added bar ID to request body:', req.barId);
  } else {
    console.log('No bar ID found in request');
  }
  next();
};

/**
 * Mongoose-Middleware zur Beschränkung von Abfragen auf die aktuelle Bar
 * @param {Object} schema - Mongoose-Schema
 */
const applyBarScope = (schema) => {
  // Pre-Find-Hook für alle Find-Operationen
  schema.pre(/^find/, function(next) {
    // this bezieht sich auf die aktuelle Query
    if (this._barId) {
      this.where({ bar: this._barId });
    }
    next();
  });

  // Methode zum Setzen der Bar-ID für die aktuelle Query
  schema.query.forBar = function(barId) {
    this._barId = barId;
    return this;
  };
};

/**
 * Routenhelfer für das Abrufen einer Liste von Dokumenten mit Bar-Filter
 * @param {Model} Model - Mongoose-Model
 * @param {Object} options - Abfrageoptionen (populate, select, sort)
 */
const getList = (Model, options = {}) => {
  return async (req, res) => {
    try {
      let query = Model.find({ bar: req.barId });
      
      // Populate-Felder hinzufügen
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      // Felder auswählen
      if (options.select) {
        query = query.select(options.select);
      }
      
      // Sortierung
      if (options.sort) {
        query = query.sort(options.sort);
      } else {
        query = query.sort('-createdAt');
      }
      
      const items = await query;
      
      res.json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (err) {
      console.error(`Fehler beim Abrufen der ${Model.modelName}:`, err);
      res.status(500).json({
        success: false,
        error: `Serverfehler beim Abrufen der ${Model.modelName}`
      });
    }
  };
};

/**
 * Routenhelfer für das Abrufen eines einzelnen Dokuments mit Bar-Filter
 * @param {Model} Model - Mongoose-Model
 * @param {Object} options - Abfrageoptionen (populate, select)
 */
const getOne = (Model, options = {}) => {
  return async (req, res) => {
    try {
      let query = Model.findOne({
        _id: req.params.id,
        bar: req.barId
      });
      
      // Populate-Felder hinzufügen
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      // Felder auswählen
      if (options.select) {
        query = query.select(options.select);
      }
      
      const item = await query;
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: `${Model.modelName} nicht gefunden`
        });
      }
      
      res.json({
        success: true,
        data: item
      });
    } catch (err) {
      console.error(`Fehler beim Abrufen des ${Model.modelName}:`, err);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({
          success: false,
          error: `${Model.modelName} nicht gefunden`
        });
      }
      
      res.status(500).json({
        success: false,
        error: `Serverfehler beim Abrufen des ${Model.modelName}`
      });
    }
  };
};

/**
 * Routenhelfer für das Erstellen eines Dokuments mit Bar-ID
 * @param {Model} Model - Mongoose-Model
 */
const createOne = (Model) => {
  return async (req, res) => {
    try {
      // Bar-ID hinzufügen
      req.body.bar = req.barId;
      
      const item = new Model(req.body);
      await item.save();
      
      res.status(201).json({
        success: true,
        data: item
      });
    } catch (err) {
      console.error(`Fehler beim Erstellen des ${Model.modelName}:`, err);
      
      // Validierungsfehler
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
          success: false,
          error: messages.join(', ')
        });
      }
      
      res.status(500).json({
        success: false,
        error: `Serverfehler beim Erstellen des ${Model.modelName}`
      });
    }
  };
};

/**
 * Routenhelfer für das Aktualisieren eines Dokuments mit Bar-Filter
 * @param {Model} Model - Mongoose-Model
 */
const updateOne = (Model) => {
  return async (req, res) => {
    try {
      // Stelle sicher, dass die Bar-ID nicht geändert wird
      req.body.bar = req.barId;
      
      const item = await Model.findOneAndUpdate(
        {
          _id: req.params.id,
          bar: req.barId
        },
        req.body,
        {
          new: true,
          runValidators: true
        }
      );
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: `${Model.modelName} nicht gefunden`
        });
      }
      
      res.json({
        success: true,
        data: item
      });
    } catch (err) {
      console.error(`Fehler beim Aktualisieren des ${Model.modelName}:`, err);
      
      // Validierungsfehler
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
          success: false,
          error: messages.join(', ')
        });
      }
      
      res.status(500).json({
        success: false,
        error: `Serverfehler beim Aktualisieren des ${Model.modelName}`
      });
    }
  };
};

/**
 * Routenhelfer für das Löschen eines Dokuments mit Bar-Filter
 * @param {Model} Model - Mongoose-Model
 */
const deleteOne = (Model) => {
  return async (req, res) => {
    try {
      const item = await Model.findOneAndDelete({
        _id: req.params.id,
        bar: req.barId
      });
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: `${Model.modelName} nicht gefunden`
        });
      }
      
      res.json({
        success: true,
        data: {}
      });
    } catch (err) {
      console.error(`Fehler beim Löschen des ${Model.modelName}:`, err);
      
      res.status(500).json({
        success: false,
        error: `Serverfehler beim Löschen des ${Model.modelName}`
      });
    }
  };
};

module.exports = {
  addBarFilter,
  addBarToBody,
  applyBarScope,
  getList,
  getOne,
  createOne,
  updateOne,
  deleteOne
};
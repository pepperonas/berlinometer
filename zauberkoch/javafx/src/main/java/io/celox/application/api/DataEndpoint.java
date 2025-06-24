package io.celox.application.api;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.logging.Logger;

import io.celox.application.utils.DbUtils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@RestController
@RequestMapping("/api")
public class DataEndpoint {

    private static final Logger LOGGER = Logger.getLogger(DataEndpoint.class.getName());

    @CrossOrigin()
    @GetMapping("/getApiLogCount")
    public int getApiLogCount() {
        try (Connection connection = DbUtils.getConnection()) {
            return DbUtils.getApiLogCount(connection);
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Abrufen der API-Log-Anzahl: " + e.getMessage());
            return -1;
        }
    }

    @CrossOrigin()
    @GetMapping("/getUserCount")
    public int getUserCount() {
        try (Connection connection = DbUtils.getConnection()) {
            return DbUtils.getAllUsers(connection).size();
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Abrufen der Benutzeranzahl: " + e.getMessage());
            return -1;
        }
    }

    // Weitere Methoden hier...
}
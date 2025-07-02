// Recipe display component with markdown support

import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Info,
  LightbulbOutlined,
  Restaurant,
} from '@mui/icons-material';
import { Recipe } from '../../types';

interface RecipeDisplayProps {
  recipe: Recipe;
}

export const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe }) => {
  // Parse instructions into steps
  const parseInstructions = (instructions: string): string[] => {
    return instructions
      .split(/\n|\./)
      .map(step => step.trim())
      .filter(step => step.length > 10)
      .map((step, index) => {
        // Remove step numbers if they exist
        const cleanStep = step.replace(/^\d+\.?\s*/, '');
        return cleanStep;
      });
  };

  const instructionSteps = parseInstructions(recipe.instructions);

  return (
    <Box>
      {/* Ingredients Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Restaurant sx={{ mr: 1 }} />
            Zutaten ({recipe.ingredients.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {recipe.ingredients.map((ingredient, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  <Typography variant="body2">
                    <strong>{ingredient.quantity} {ingredient.unit}</strong> {ingredient.name}
                  </Typography>
                </ListItemText>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Instructions Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Info sx={{ mr: 1 }} />
            Zubereitung ({instructionSteps.length} Schritte)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {instructionSteps.map((step, index) => (
              <ListItem key={index} alignItems="flex-start" sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <Chip 
                    label={index + 1} 
                    size="small" 
                    color="primary" 
                    sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                  />
                </ListItemIcon>
                <ListItemText>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {step}
                  </Typography>
                </ListItemText>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Tips Section */}
      {recipe.tips && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <LightbulbOutlined sx={{ mr: 1 }} />
              Tipps & Tricks
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Card variant="outlined" sx={{ backgroundColor: 'action.hover' }}>
              <CardContent>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {recipe.tips}
                </Typography>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Important Notes Section */}
      {recipe.importantNotes && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
              <Info sx={{ mr: 1 }} />
              Wichtige Hinweise
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Card variant="outlined" sx={{ backgroundColor: 'warning.light', alpha: 0.1 }}>
              <CardContent>
                <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'warning.dark' }}>
                  {recipe.importantNotes}
                </Typography>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Recipe Metadata */}
      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="textSecondary" display="block">
          Erstellt am: {new Date(recipe.createdAt).toLocaleDateString('de-DE')}
        </Typography>
        {recipe.apiLogId && (
          <Typography variant="caption" color="textSecondary" display="block">
            Rezept-ID: {recipe.apiLogId}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default RecipeDisplay;
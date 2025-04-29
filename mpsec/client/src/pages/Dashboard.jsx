import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../services/api';
import {
  Button,
  Card,
  CardContent,
  PageHeader,
  PageTitle,
  Alert,
  LoaderContainer,
  Loader,
  Badge,
  ButtonGroup,
  Input,
  FormGroup,
  TokenCode,
  ProgressBar,
  TimeRemaining,
  Grid as StyledGrid
} from '../components/styled';
import {
  AddIcon,
  ImportIcon,
  SortIcon,
  SaveIcon,
  DetailsIcon,
  DeleteIcon,
  CancelIcon,
  LoadingIcon,
  CopyIcon
} from '../components/Icons';

// Toast-Komponente für Benachrichtigungen
const Toast = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(104, 141, 177, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: ${({ show }) => (show ? 'block' : 'none')};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TokenCard = styled(Card)`
  transition: ${({ theme }) => theme.transitions.default};
  cursor: default;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const DraggableTokenCard = styled(TokenCard)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;
  background-color: ${({ isDragging, theme }) =>
      isDragging ? `${theme.colors.backgroundDarker}` : `${theme.colors.cardBackground}`};
`;

const TokenName = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  word-break: break-word;
`;

const TokenIssuer = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  word-break: break-word;
`;

const TokenInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const TokenActions = styled.div`
  display: flex;
  align-items: center;
`;

const TokenType = styled(Badge)`
  margin-right: ${({ theme }) => theme.spacing.xs};
`;

const SearchContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ActionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;

    & > div:first-child {
      margin-bottom: ${({ theme }) => theme.spacing.md};
      width: 100%;
    }

    & > button {
      width: 100%;
      justify-content: center;
    }
  }
`;

const DeleteConfirmation = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: rgba(225, 97, 98, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border-left: 4px solid ${({ theme }) => theme.colors.accentRed};
`;

const DetailsButton = styled(Button)`
  margin-left: auto;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  min-width: 0;
  z-index: 10;
`;

const CardTokenCode = styled(TokenCode)`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin: ${({ theme }) => theme.spacing.md} 0;
  padding: ${({ theme }) => theme.spacing.md};
  position: relative;

  &:hover .copy-icon {
    opacity: 1;
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    letter-spacing: 0.15em;
  }
`;

const CopyIconContainer = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const TokenTimeRemaining = styled(TimeRemaining)`
  margin-top: ${({ theme }) => theme.spacing.md};
  margin-bottom: 0;
`;

// Grid mit Drag-and-Drop-Funktionalität
const DraggableGrid = styled(StyledGrid)`
  @media (max-width: 768px) {
    padding: 0 ${({ theme }) => theme.spacing.xs};
  }
`;

// Expliziter Drag-Handle für bessere Benutzbarkeit
const DragHandle = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 20;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background-color: ${({ theme }) => theme.colors.accentBlue};
    color: white;
  }

  &:before {
    content: '⠿';
    font-size: 24px;
  }

  &:active {
    cursor: grabbing;
  }
`;

const ToggleOrderingButton = styled(Button)`
  margin-left: ${({ theme }) => theme.spacing.md};
`;

const ReorderNotice = styled.div`
  background-color: ${({ theme }) => theme.colors.accentBlue};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-align: center;

  span {
    margin-right: ${({ theme }) => theme.spacing.sm};
  }
`;

// Layout-Komponenten für den PageHeader
const ResponsivePageHeader = styled(PageHeader)`
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    
    & > h1 {
      margin-bottom: ${({ theme }) => theme.spacing.md};
    }
  }
`;

const ResponsiveButtonGroup = styled(ButtonGroup)`
  @media (max-width: 768px) {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: ${({ theme }) => theme.spacing.xs};
    
    & > * {
      width: 100%;
    }
  }
`;

const Dashboard = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  // Neue Zustände für OTP-Codes
  const [tokenCodes, setTokenCodes] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const timerRef = useRef({});
  const navigate = useNavigate();

  // Reordering-Zustand
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Laden der Tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await api.get('/tokens');
        setTokens(response.data.data);
      } catch (err) {
        console.error('Fehler beim Laden der Tokens:', err);
        setError('Tokens konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();

    // Cleanup bei Komponenten-Unmount
    return () => {
      // Alle Timer bereinigen
      Object.values(timerRef.current).forEach(timerId => {
        clearInterval(timerId);
      });
    };
  }, []);

  // OTP-Codes für alle Tokens laden
  useEffect(() => {
    const loadTokenCodes = async () => {
      // Bestehende Timer bereinigen
      Object.values(timerRef.current).forEach(timerId => {
        clearInterval(timerId);
      });

      timerRef.current = {};

      // Für jeden Token den OTP-Code laden
      tokens.forEach(token => {
        generateTokenCode(token._id);

        // Timer für regelmäßige Aktualisierung einrichten
        timerRef.current[token._id] = setInterval(() => {
          generateTokenCode(token._id);
        }, 5000); // Alle 5 Sekunden aktualisieren
      });
    };

    if (tokens.length > 0) {
      loadTokenCodes();
    }

    // Cleanup bei Komponenten-Unmount oder wenn Tokens sich ändern
    return () => {
      Object.values(timerRef.current).forEach(timerId => {
        clearInterval(timerId);
      });
    };
  }, [tokens]);

  // OTP-Code für einen Token generieren
  const generateTokenCode = async (tokenId) => {
    try {
      const response = await api.get(`/tokens/${tokenId}/code`);
      if (response.data.success) {
        setTokenCodes(prev => ({
          ...prev,
          [tokenId]: {
            code: response.data.data.code,
            remainingTime: response.data.data.remainingTime,
            period: tokens.find(t => t._id === tokenId)?.period || 30,
            progress: (response.data.data.remainingTime / (tokens.find(t => t._id === tokenId)?.period || 30)) * 100
          }
        }));
      }
    } catch (err) {
      console.error(`Fehler beim Generieren des Codes für Token ${tokenId}:`, err);
    }
  };

  // Code in die Zwischenablage kopieren
  const copyToClipboard = (e, code, tokenName) => {
    e.preventDefault();
    e.stopPropagation();

    navigator.clipboard.writeText(code)
        .then(() => {
          setToastMessage(`Code für ${tokenName} wurde kopiert`);
          setShowToast(true);

          // Toast nach 3 Sekunden ausblenden
          setTimeout(() => {
            setShowToast(false);
          }, 3000);
        })
        .catch(err => {
          console.error('Fehler beim Kopieren in die Zwischenablage:', err);
        });
  };

  // Entfernt: Card-Klick leitet nicht mehr zur Detailseite weiter

  // Navigation zur Token-Detailseite (nur über den Details-Button)
  const handleDetailsClick = (e, tokenId) => {
    if (isReordering) {
      e.preventDefault();
      return;
    }

    navigate(`/tokens/${tokenId}`);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTokens = tokens.filter(token => {
    const searchLower = searchTerm.toLowerCase();
    return (
        token.name.toLowerCase().includes(searchLower) ||
        (token.issuer && token.issuer.toLowerCase().includes(searchLower))
    );
  });

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete('/tokens');
      setDeleteMessage(response.data.message || `${response.data.count} Tokens wurden gelöscht`);
      setTokens([]);
      setShowDeleteConfirm(false);
      // Erfolgsmeldung anzeigen
      setTimeout(() => {
        setDeleteMessage('');
      }, 3000);
    } catch (err) {
      console.error('Fehler beim Löschen aller Tokens:', err);
      setError('Tokens konnten nicht gelöscht werden');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reihenfolge-Funktionen
  const toggleReordering = () => {
    if (isReordering) {
      // Speichern der aktuellen Reihenfolge beim Verlassen des Reordering-Modus
      saveOrder();
    }
    setIsReordering(!isReordering);
  };

  const saveOrder = async () => {
    setIsSavingOrder(true);
    try {
      // Bereite die Daten für die API vor
      const tokenOrder = tokens.map((token, index) => ({
        id: token._id
      }));

      // Sende die neue Reihenfolge an den Server
      await api.put('/tokens/reorder', { tokenOrder });

      setToastMessage('Neue Reihenfolge gespeichert');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Fehler beim Speichern der Reihenfolge:', err);
      setError('Reihenfolge konnte nicht gespeichert werden');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragEnd = (result) => {
    // Wenn außerhalb der Drop-Zone oder keine Bewegung
    if (!result.destination) {
      return;
    }

    // Wenn die Position nicht geändert wurde
    if (result.destination.index === result.source.index) {
      return;
    }

    // Tokens neu anordnen
    const reorderedTokens = Array.from(tokens);
    const [reorderedItem] = reorderedTokens.splice(result.source.index, 1);
    reorderedTokens.splice(result.destination.index, 0, reorderedItem);

    // Lokale State aktualisieren
    setTokens(reorderedTokens);
  };

  if (loading) {
    return (
        <LoaderContainer>
          <Loader size="40px" />
        </LoaderContainer>
    );
  }

  return (
      <>
        <ResponsivePageHeader>
          <PageTitle>Deine 2FA-Tokens</PageTitle>
          <ResponsiveButtonGroup>
            <Button
                as={Link}
                to="/tokens/add"
                variant="primary"
                iconOnly
            >
              <AddIcon />
              <span className="button-text">Neuen Token hinzufügen</span>
            </Button>
            <Button
                as={Link}
                to="/tokens/import"
                variant="outline"
                iconOnly
            >
              <ImportIcon />
              <span className="button-text">Tokens importieren</span>
            </Button>
            {tokens.length > 1 && (
                <ToggleOrderingButton
                    variant={isReordering ? "success" : "outline"}
                    onClick={toggleReordering}
                    disabled={isSavingOrder}
                    iconOnly
                >
                  {isReordering
                      ? isSavingOrder
                          ? <LoadingIcon />
                          : <SaveIcon />
                      : <SortIcon />
                  }
                  <span className="button-text">
                {isReordering
                    ? isSavingOrder
                        ? 'Speichere...'
                        : 'Sortierung speichern'
                    : 'Sortierung ändern'}
              </span>
                </ToggleOrderingButton>
            )}
          </ResponsiveButtonGroup>
        </ResponsivePageHeader>

        {error && <Alert type="error">{error}</Alert>}
        {deleteMessage && <Alert type="success">{deleteMessage}</Alert>}

        {isReordering && (
            <ReorderNotice>
              <span>⟲</span> Ziehe die Tokens mit dem Griff-Symbol (⠿), um sie neu anzuordnen
            </ReorderNotice>
        )}

        {tokens.length > 0 && (
            <>
              <ActionContainer>
                <SearchContainer>
                  <FormGroup>
                    <Input
                        type="text"
                        placeholder="Tokens durchsuchen..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                  </FormGroup>
                </SearchContainer>

                {!showDeleteConfirm && !isReordering ? (
                    <Button
                        variant="danger"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={tokens.length === 0}
                        iconOnly
                    >
                      <DeleteIcon />
                      <span className="button-text">Alle Tokens löschen</span>
                    </Button>
                ) : null}
              </ActionContainer>

              {showDeleteConfirm && (
                  <DeleteConfirmation>
                    <h4>Wirklich alle Tokens löschen?</h4>
                    <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
                    <ButtonGroup style={{ marginTop: '1rem' }}>
                      <Button
                          variant="danger"
                          onClick={handleDeleteAll}
                          disabled={isDeleting}
                          iconOnly
                      >
                        {isDeleting ? <LoadingIcon /> : <DeleteIcon />}
                        <span className="button-text">{isDeleting ? 'Wird gelöscht...' : 'Ja, alle löschen'}</span>
                      </Button>
                      <Button
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                          iconOnly
                      >
                        <CancelIcon />
                        <span className="button-text">Abbrechen</span>
                      </Button>
                    </ButtonGroup>
                  </DeleteConfirmation>
              )}
            </>
        )}

        {tokens.length === 0 ? (
            <EmptyState>
              <h3>Keine Tokens vorhanden</h3>
              <p>Füge deinen ersten 2FA-Token hinzu, um zu beginnen</p>
              <ButtonGroup style={{ marginTop: '1rem', justifyContent: 'center' }}>
                <Button
                    as={Link}
                    to="/tokens/add"
                    variant="primary"
                    iconOnly
                >
                  <AddIcon />
                  <span className="button-text">Token hinzufügen</span>
                </Button>
                <Button
                    as={Link}
                    to="/tokens/import"
                    variant="outline"
                    iconOnly
                >
                  <ImportIcon />
                  <span className="button-text">Tokens importieren</span>
                </Button>
              </ButtonGroup>
            </EmptyState>
        ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="token-list" direction="horizontal">
                {(provided) => (
                    <DraggableGrid
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                      {filteredTokens.map((token, index) => (
                          <Draggable
                              key={token._id}
                              draggableId={token._id}
                              index={index}
                              isDragDisabled={!isReordering}
                          >
                            {(provided, snapshot) => (
                                <DraggableTokenCard
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    isDragging={snapshot.isDragging}
                                >
                                  {isReordering && (
                                      <DragHandle
                                          {...provided.dragHandleProps}
                                      />
                                  )}
                                  <CardContent style={{ cursor: 'default' }}>
                                    <TokenName>{token.name}</TokenName>
                                    {token.issuer && <TokenIssuer>{token.issuer}</TokenIssuer>}

                                    {/* OTP-Code anzeigen */}
                                    {tokenCodes[token._id] ? (
                                        <>
                                          <CardTokenCode
                                              onClick={(e) => copyToClipboard(e, tokenCodes[token._id].code, token.name)}
                                              style={{ cursor: 'pointer' }}
                                          >
                                            {tokenCodes[token._id].code || '------'}
                                            <CopyIconContainer className="copy-icon">
                                              <CopyIcon />
                                            </CopyIconContainer>
                                          </CardTokenCode>
                                          <TokenTimeRemaining>
                                            <ProgressBar progress={tokenCodes[token._id].progress || 0} />
                                          </TokenTimeRemaining>
                                        </>
                                    ) : (
                                        <CardTokenCode>------</CardTokenCode>
                                    )}

                                    <TokenInfo>
                                      <TokenActions>
                                        <TokenType type="primary">{token.type.toUpperCase()}</TokenType>
                                        <TokenType>{token.digits} Ziffern</TokenType>
                                      </TokenActions>
                                      <DetailsButton
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => handleDetailsClick(e, token._id)}
                                          iconOnly
                                      >
                                        <DetailsIcon />
                                        <span className="button-text">Details</span>
                                      </DetailsButton>
                                    </TokenInfo>
                                  </CardContent>
                                </DraggableTokenCard>
                            )}
                          </Draggable>
                      ))}
                      {provided.placeholder}
                    </DraggableGrid>
                )}
              </Droppable>
            </DragDropContext>
        )}

        {filteredTokens.length === 0 && tokens.length > 0 && (
            <EmptyState>
              <h3>Keine Tokens gefunden</h3>
              <p>Keine Ergebnisse für "{searchTerm}"</p>
            </EmptyState>
        )}

        {/* Toast-Benachrichtigung */}
        <Toast show={showToast}>{toastMessage}</Toast>
      </>
  );
};

export default Dashboard;
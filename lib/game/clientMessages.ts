/** Learner-facing API error and status copy (Italian). */
export const gameClientMessages = {
  couldNotLoadWallet: "Impossibile caricare il portafoglio.",
  couldNotLoadCatalog: "Impossibile caricare il catalogo di gioco.",
  couldNotLoadLeaderboard: "Impossibile caricare la classifica.",
  couldNotLoadProfile: "Impossibile caricare il profilo.",
  couldNotLoadRun: "Impossibile caricare la partita.",
  couldNotStartRun: "Impossibile avviare la partita.",
  couldNotAdvanceScene: "Impossibile avanzare la scena.",
  couldNotRetreatScene: "Impossibile tornare alla scena precedente.",
  retreatNotAllowed: "Non puoi tornare indietro da questa scena.",
  couldNotCompleteTask: "Impossibile completare l'attivita.",
  runNotFound: "Partita non trovata.",
  activeRunExists: "Hai gia una partita in corso in un'altra missione.",
  questLocked: "Questa missione e ancora bloccata.",
  invalidSceneProgression: "Progressione scena non valida.",
  taskEvaluationNotImplemented: "Valutazione task non ancora disponibile.",
  taskMinRatioNotMet: "Non abbastanza risposte corrette per completare l'attivita.",
  freitextAnswerEmpty: "Scrivi qualcosa prima di toccare Controlla.",
  freitextPayloadInvalid: "Contenuto attività freitext non valido.",
  llmNotConfigured: "Il valutatore non è disponibile. Riprova più tardi.",
  modelTimedOut: "Il valutatore ha impiegato troppo tempo. Riprova.",
  freitextEvaluatorError: "Il valutatore non è disponibile. Riprova.",
} as const;

/** Auth screens (login/register) — learner-facing Italian. */
export const authUiLabels = {
  username: "Nome utente",
  password: "Parola segreta",
  repeatPassword: "Ripeti la parola segreta",
  usernamePlaceholder: "nome-utente",
  passwordPlaceholder: "parola-segreta",
} as const;

/** Auth API routes (login/register/session). */
export const authClientMessages = {
  tooManyRequests: "Troppe richieste. Riprova tra poco.",
  invalidJson: "Corpo della richiesta non valido.",
  invalidRequest: "Richiesta non valida.",
  couldNotProcess: "Impossibile elaborare la richiesta.",
  invalidCredentials: "Nome utente o parola segreta non validi.",
  couldNotCreateSession: "Impossibile creare la sessione.",
  couldNotCreateAccount: "Impossibile creare l'account.",
  couldNotValidateSession: "Impossibile verificare la sessione.",
  couldNotRevokeSession: "Impossibile chiudere la sessione.",
  missingToken: "Token mancante.",
  invalidSession: "Sessione non valida o scaduta.",
  usernameTaken: "Nome utente già in uso.",
  passwordsDoNotMatch: "Le parole segrete non coincidono.",
  missingTokenBody: "Token mancante.",
  invalidUsernameCharacters: "Caratteri nome utente non validi (solo a-z, 0-9, -).",
} as const;

/** Shared HTTP route copy returned before service layer. */
export const apiRouteMessages = {
  tooManyRequests: "Troppe richieste. Riprova tra poco.",
  invalidRequest: "Richiesta non valida.",
  invalidJson: "Corpo della richiesta non valido.",
  bodyTooLarge: "Richiesta troppo grande.",
  invalidBody: "Corpo della richiesta non valido.",
} as const;

/** Server-side task attempt scoring errors (Italian). */
export const scoringClientMessages = {
  clozePayloadNoGaps: "Il payload Cloze non ha lacune.",
  clozeGapCountMismatch: "Il numero di risposte Cloze non corrisponde.",
  invalidClozeAnswer: "Risposta Cloze non valida.",
  optionalClozeAllOrNothing: "Il blocco Cloze opzionale va completato per intero o lasciato vuoto.",
  optionalClozeIncorrect: "Il blocco Cloze opzionale ha risposte errate.",
  mcAttemptLengthMismatch: "Il numero di risposte a scelta multipla non corrisponde.",
  dragDropLinesNotImplemented: "La valutazione DragDrop in modalità righe non è ancora implementata sul server.",
  dragDropNoTargets: "DragDrop non ha bersagli.",
  dragDropMissingCorrectIds: "I bersagli DragDrop non hanno correctItemIds.",
  matchingNoPairs: "Abbinamento senza coppie corrette.",
  errorSpottingNoErrors: "Error spotting senza errori definiti.",
  specialScreenBlockLengthMismatch: "Il numero di tentativi nei blocchi non corrisponde.",
  specialScreenBlockMissingAttempt: (blockIndex: number) =>
    `Manca il tentativo per il blocco ${blockIndex}.`,
  specialScreenUnsupportedBlockType: (blockIndex: number, blockType: string) =>
    `Il blocco ${blockIndex} usa un blockType non supportato per la valutazione («${blockType}»).`,
  specialScreenBlockMissingContent: (blockIndex: number, blockType: string) =>
    `Il blocco ${blockIndex} (${blockType}) non ha contenuto annidato in content_payload.`,
  specialScreenBlockTypeMismatch: (blockIndex: number) =>
    `Il tipo di tentativo del blocco ${blockIndex} non corrisponde.`,
  specialScreenCompleteOneIdentikit: "Completa almeno un blocco identikit opzionale.",
  invalidTaskAttemptPayload: "Payload del tentativo non valido.",
  attemptTaskTypeMismatch: "Il taskType del tentativo non corrisponde al passo.",
  unsupportedTaskType: "Tipo di attività non supportato.",
} as const;

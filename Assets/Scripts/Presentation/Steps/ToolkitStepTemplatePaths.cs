namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Resources paths (no extension) for quest step UXML templates under LearningToolkit/Templates.
    /// Cutscene portraits (sprites): UI/CutscenePortraits/Player/current and UI/CutscenePortraits/Npc/{portraitId}.
    /// </summary>
    internal static class ToolkitStepTemplatePaths
    {
        private const string Root = "UI/LearningToolkit/Templates";

        public const string CutsceneHost = Root + "/Cutscenes/CutsceneHost";
        public const string CutsceneNarratorBeat = Root + "/Cutscenes/CutsceneNarratorBeat";
        public const string CutsceneNpcDialogBeat = Root + "/Cutscenes/CutsceneNpcDialogBeat";
        public const string CutsceneInnerMonologueBeat = Root + "/Cutscenes/CutsceneInnerMonologueBeat";
        public const string CutsceneGameInfoBeat = Root + "/Cutscenes/CutsceneGameInfoBeat";

        public const string ClozeTextTask = Root + "/Tasks/ClozeTextTaskTemplate";
        public const string ErrorSpottingTask = Root + "/Tasks/ErrorSpottingTaskTemplate";
        public const string FreitextLlmTask = Root + "/Tasks/FreitextLlmTaskTemplate";
        public const string MultipleChoiceTask = Root + "/Tasks/MultipleChoiceTaskTemplate";
        public const string DragDropTask = Root + "/Tasks/DragDropTaskTemplate";
        public const string MatchingTask = Root + "/Tasks/MatchingTaskTemplate";

        private const string Parts = Root + "/Parts";

        public const string McOptionRowPart = Parts + "/McOptionRowPart";
        public const string McStemTextPart = Parts + "/McStemTextPart";
        public const string McStemImagePart = Parts + "/McStemImagePart";
        public const string McStemAudioPart = Parts + "/McStemAudioPart";

        public const string ClozeLineRowPart = Parts + "/ClozeLineRowPart";
        public const string ClozeLiteralPart = Parts + "/ClozeLiteralPart";
        public const string ClozeGapFieldPart = Parts + "/ClozeGapFieldPart";

        public const string ErrorSpottingSlotPart = Parts + "/ErrorSpottingSlotPart";
        public const string ErrorSpottingChipPart = Parts + "/ErrorSpottingChipPart";
        public const string ErrorSpottingInlineFieldPart = Parts + "/ErrorSpottingInlineFieldPart";

        public const string DragDropTilePart = Parts + "/DragDropTilePart";
        public const string DragDropTargetBlockPart = Parts + "/DragDropTargetBlockPart";
        public const string DragDropDropZoneInnerPart = Parts + "/DragDropDropZoneInnerPart";
        public const string DragDropLineSlotPart = Parts + "/DragDropLineSlotPart";

        public const string MatchingCardPart = Parts + "/MatchingCardPart";
        public const string MatchingLeftRowPart = Parts + "/MatchingLeftRowPart";
        public const string MatchingColumnHeaderPart = Parts + "/MatchingColumnHeaderPart";

        public const string DragDropCaptionPart = Parts + "/DragDropCaptionPart";
        public const string DragDropBankWrapPart = Parts + "/DragDropBankWrapPart";
        public const string DragDropLineRowPart = Parts + "/DragDropLineRowPart";

        public const string SpecialScreenChatRowIncomingPart = Parts + "/SpecialScreenChatRowIncomingPart";
        public const string SpecialScreenChatRowOutgoingPart = Parts + "/SpecialScreenChatRowOutgoingPart";
        public const string SpecialScreenBubbleAuthorPart = Parts + "/SpecialScreenBubbleAuthorPart";
        public const string SpecialScreenBubbleTextPart = Parts + "/SpecialScreenBubbleTextPart";
        public const string SpecialScreenBubbleMechanicHostPart = Parts + "/SpecialScreenBubbleMechanicHostPart";
        public const string SpecialScreenMailHeaderRowPart = Parts + "/SpecialScreenMailHeaderRowPart";
        public const string SpecialScreenReaderLineRowPart = Parts + "/SpecialScreenReaderLineRowPart";
        public const string SpecialScreenPhotoGridCellPart = Parts + "/SpecialScreenPhotoGridCellPart";
        public const string SpecialScreenPhotoGridPart = Parts + "/SpecialScreenPhotoGridPart";
        public const string SpecialScreenPhotoSlideshowPart = Parts + "/SpecialScreenPhotoSlideshowPart";
        public const string SpecialScreenPhotoPromptPart = Parts + "/SpecialScreenPhotoPromptPart";
        public const string SpecialScreenPhotoCaptionFixedPart = Parts + "/SpecialScreenPhotoCaptionFixedPart";
        public const string SpecialScreenPhotoLoadErrorPart = Parts + "/SpecialScreenPhotoLoadErrorPart";
        public const string SpecialScreenPhotoLearnerFieldPart = Parts + "/SpecialScreenPhotoLearnerFieldPart";
        public const string SpecialScreenBlockSlotPart = Parts + "/SpecialScreenBlockSlotPart";
        public const string SpecialScreenReaderBodyLabelPart = Parts + "/SpecialScreenReaderBodyLabelPart";
        public const string SpecialScreenReaderColumnsRowPart = Parts + "/SpecialScreenReaderColumnsRowPart";
        public const string StubTaskPanelPart = Parts + "/StubTaskPanelPart";

        private const string SpecialScreens = Root + "/SpecialScreens";

        public const string SpecialScreenMessengerChrome = SpecialScreens + "/SpecialScreenMessengerChrome";
        public const string SpecialScreenMailChrome = SpecialScreens + "/SpecialScreenMailChrome";
        public const string SpecialScreenReaderChrome = SpecialScreens + "/SpecialScreenReaderChrome";
        public const string SpecialScreenPhotoChrome = SpecialScreens + "/SpecialScreenPhotoChrome";

        public const string SpecialScreenHost = "UI/LearningToolkit/SpecialScreenHost";
    }
}

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

        public const string ClozeTextTask = Root + "/Tasks/ClozeText/ClozeTextTaskTemplate";
        public const string ErrorSpottingTask = Root + "/Tasks/ErrorSpotting/ErrorSpottingTaskTemplate";
        public const string FreitextLlmTask = Root + "/Tasks/FreitextLlm/FreitextLlmTaskTemplate";
        public const string MultipleChoiceTask = Root + "/Tasks/MultipleChoice/MultipleChoiceTaskTemplate";
        public const string DragDropTask = Root + "/Tasks/DragDrop/DragDropTaskTemplate";
        public const string MatchingTask = Root + "/Tasks/Matching/MatchingTaskTemplate";

        private const string Parts = Root + "/Parts";

        public const string McOptionRowPart = Parts + "/MultipleChoice/McOptionRowPart";
        public const string McStemTextPart = Parts + "/MultipleChoice/McStemTextPart";
        public const string McStemImagePart = Parts + "/MultipleChoice/McStemImagePart";
        public const string McStemAudioPart = Parts + "/MultipleChoice/McStemAudioPart";

        public const string ClozeLineRowPart = Parts + "/ClozeText/ClozeLineRowPart";
        public const string ClozeLiteralPart = Parts + "/ClozeText/ClozeLiteralPart";
        public const string ClozeGapFieldPart = Parts + "/ClozeText/ClozeGapFieldPart";

        public const string ErrorSpottingSlotPart = Parts + "/ErrorSpotting/ErrorSpottingSlotPart";
        public const string ErrorSpottingChipPart = Parts + "/ErrorSpotting/ErrorSpottingChipPart";
        public const string ErrorSpottingInlineFieldPart = Parts + "/ErrorSpotting/ErrorSpottingInlineFieldPart";

        public const string DragDropTilePart = Parts + "/DragDrop/DragDropTilePart";
        public const string DragDropTargetBlockPart = Parts + "/DragDrop/DragDropTargetBlockPart";
        public const string DragDropDropZoneInnerPart = Parts + "/DragDrop/DragDropDropZoneInnerPart";
        public const string DragDropLineSlotPart = Parts + "/DragDrop/DragDropLineSlotPart";

        public const string MatchingCardPart = Parts + "/Matching/MatchingCardPart";
        public const string MatchingLeftRowPart = Parts + "/Matching/MatchingLeftRowPart";
        public const string MatchingColumnHeaderPart = Parts + "/Matching/MatchingColumnHeaderPart";

        public const string DragDropCaptionPart = Parts + "/DragDrop/DragDropCaptionPart";
        public const string DragDropBankWrapPart = Parts + "/DragDrop/DragDropBankWrapPart";
        public const string DragDropLineRowPart = Parts + "/DragDrop/DragDropLineRowPart";

        public const string SpecialScreenChatRowIncomingPart = Parts + "/SpecialScreen/SpecialScreenChatRowIncomingPart";
        public const string SpecialScreenChatRowOutgoingPart = Parts + "/SpecialScreen/SpecialScreenChatRowOutgoingPart";
        public const string SpecialScreenBubbleAuthorPart = Parts + "/SpecialScreen/SpecialScreenBubbleAuthorPart";
        public const string SpecialScreenBubbleTextPart = Parts + "/SpecialScreen/SpecialScreenBubbleTextPart";
        public const string SpecialScreenBubbleMechanicHostPart = Parts + "/SpecialScreen/SpecialScreenBubbleMechanicHostPart";
        public const string SpecialScreenMailHeaderRowPart = Parts + "/SpecialScreen/SpecialScreenMailHeaderRowPart";
        public const string SpecialScreenReaderLineRowPart = Parts + "/SpecialScreen/SpecialScreenReaderLineRowPart";
        public const string SpecialScreenPhotoGridCellPart = Parts + "/SpecialScreen/SpecialScreenPhotoGridCellPart";
        public const string SpecialScreenPhotoGridPart = Parts + "/SpecialScreen/SpecialScreenPhotoGridPart";
        public const string SpecialScreenPhotoSlideshowPart = Parts + "/SpecialScreen/SpecialScreenPhotoSlideshowPart";
        public const string SpecialScreenPhotoPromptPart = Parts + "/SpecialScreen/SpecialScreenPhotoPromptPart";
        public const string SpecialScreenPhotoCaptionFixedPart = Parts + "/SpecialScreen/SpecialScreenPhotoCaptionFixedPart";
        public const string SpecialScreenPhotoLoadErrorPart = Parts + "/SpecialScreen/SpecialScreenPhotoLoadErrorPart";
        public const string SpecialScreenPhotoLearnerFieldPart = Parts + "/SpecialScreen/SpecialScreenPhotoLearnerFieldPart";
        public const string SpecialScreenBlockSlotPart = Parts + "/SpecialScreen/SpecialScreenBlockSlotPart";
        public const string SpecialScreenReaderBodyLabelPart = Parts + "/SpecialScreen/SpecialScreenReaderBodyLabelPart";
        public const string SpecialScreenReaderColumnsRowPart = Parts + "/SpecialScreen/SpecialScreenReaderColumnsRowPart";
        public const string StubTaskPanelPart = Parts + "/Common/StubTaskPanelPart";

        private const string SpecialScreens = Root + "/SpecialScreens";

        public const string SpecialScreenMessengerChrome = SpecialScreens + "/SpecialScreenMessengerChrome";
        public const string SpecialScreenMailChrome = SpecialScreens + "/SpecialScreenMailChrome";
        public const string SpecialScreenReaderChrome = SpecialScreens + "/SpecialScreenReaderChrome";
        public const string SpecialScreenPhotoChrome = SpecialScreens + "/SpecialScreenPhotoChrome";

        public const string SpecialScreenHost = "UI/LearningToolkit/Templates/SpecialScreens/SpecialScreenHost";
    }
}

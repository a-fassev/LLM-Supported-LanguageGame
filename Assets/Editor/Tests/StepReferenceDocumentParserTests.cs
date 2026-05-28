using LanguageGame.Application;
using NUnit.Framework;

namespace LanguageGame.Tests.EditMode
{
    public sealed class StepReferenceDocumentParserTests
    {
        [Test]
        public void Parse_ReturnsDocument_WhenReferenceDocumentIsValid()
        {
            const string json =
                "{\"referenceDocument\":{\"documentId\":\"doc-1\",\"title\":\"Titolo\",\"bodyText\":\"Corpo\",\"buttonLabel\":\"Apri\"}}";

            var doc = StepReferenceDocumentParser.Parse(json);

            Assert.NotNull(doc);
            Assert.AreEqual("doc-1", doc.documentId);
            Assert.AreEqual("Titolo", doc.title);
            Assert.AreEqual("Corpo", doc.bodyText);
            Assert.AreEqual("Apri", doc.buttonLabel);
        }

        [Test]
        public void Parse_ReturnsNull_WhenReferenceDocumentHasMissingBodyText()
        {
            const string json = "{\"referenceDocument\":{\"title\":\"Titolo\"}}";

            var doc = StepReferenceDocumentParser.Parse(json);

            Assert.IsNull(doc);
        }

        [Test]
        public void Parse_ReturnsNull_WhenJsonIsNotObject()
        {
            const string json = "[]";

            var doc = StepReferenceDocumentParser.Parse(json);

            Assert.IsNull(doc);
        }
    }
}

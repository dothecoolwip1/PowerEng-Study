# Textbook Analysis

## Source

Power Engineering Fourth Class, Part A, Edition 3.5. The PDF contains 1,858 pages. It has a usable text layer, so the ingestion pipeline uses PyMuPDF text extraction and does not use OCR.

## Detected structure

- 12 Part A units
- 56 chapters
- 294 objective or chapter-introduction study sections
- 1,741 chapter-content PDF pages mapped into lessons
- 53 unique textbook Self-Test records detected
- 80 Knowledge Exercise page sets detected
- 877 automatically extracted equation candidates
- 31 curated and verified Unit A-1 formulas in the first content-review pass

## Unit map

1. Elementary Mechanics and Dynamics
2. Elementary Physical, Chemical, and Thermodynamic Principles
3. Introduction to Power Engineering and its Governance in Canada
4. Introduction to Plant and Fire Safety
5. Introduction to Plant Operations and the Environment
6. Elements of Material Science and Welding Technology
7. Introductory Fluid Handling Technology
8. Basic Concepts in Electrotechnology
9. Energy Plant Instrumentation and Controls
10. Fundamental Industrial Communication Skills
11. Introduction to Boiler Designs
12. Elements of Boiler Systems

## Extraction characteristics

The PDF has highly regular chapter title pages, learning outcomes, learning objectives, objective markers, summaries, and unit boundaries. That makes chapter and objective hierarchy extraction reliable.

The PDF does not contain a useful bookmark table of contents. Navigation therefore comes from detected structure rather than PDF bookmarks.

Mathematical text extraction is imperfect. Fractions, superscripts, subscripts, and some symbols can be fragmented by the PDF text layer. For this reason, automatically extracted equation candidates are labelled `raw_extraction`. Curated formulas use structured LaTeX and source pages.

Figures, diagrams, and tables are important in several chapters. The structured study content keeps source page references, and the app includes a local PDF page viewer so the student can inspect the original figure when the extracted text is not sufficient.

## Representative chapter

Unit A-1, Chapter 2, Forces and Moments, is the first fully enhanced chapter. It was selected because it tests several important parts of the architecture at once: equations, equilibrium logic, beam reactions, diagrams, worked examples, self tests, common conceptual mistakes, quick checks, and direct source references.

## Content integrity strategy

Every transformed item has a source page and verification status. The app distinguishes verified curated formulas from raw extraction candidates and keeps textbook answers separate from generated practice. The automatic ingestion does not silently promote extracted equations or questions to verified status.

import pptxgen from "pptxgenjs";
import { PresentationData, GeneratorSettings } from "../types";

export async function createPptx(data: PresentationData, settings: GeneratorSettings) {
  const pres = new pptxgen();
  
  // 1. Introduction Slide
  const introSlide = pres.addSlide();
  introSlide.background = { color: "FFFFFF" };
  
  // Topic Title
  introSlide.addText(data.topic, {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 44, bold: true, color: "000000",
    align: "center", fontFace: "Arial"
  });
  
  // User Info
  introSlide.addText(`Presented by: ${data.userName}`, {
    x: 0.5, y: 3.5, w: 9, h: 0.5,
    fontSize: 24, color: "333333",
    align: "center"
  });
  
  introSlide.addText(`Roll Number: ${data.rollNumber}`, {
    x: 0.5, y: 4.1, w: 9, h: 0.5,
    fontSize: 18, color: "666666",
    align: "center"
  });
  
  introSlide.addText(data.collegeName, {
    x: 0.5, y: 4.7, w: 9, h: 0.5,
    fontSize: 18, color: "666666",
    align: "center"
  });

  // Logo on Intro Slide if enabled
  if (settings.showLogo) {
    if (data.customLogoUrl) {
      introSlide.addImage({
        data: data.customLogoUrl,
        x: 8.5, y: 0.2, w: 1.2, h: 0.8,
        sizing: { type: "contain", w: 1.2, h: 0.8 }
      });
    } else {
      introSlide.addText("IARE", {
        x: 8.5, y: 0.2, w: 1.2, h: 0.5,
        fontSize: 20, bold: true, color: "FF0000",
        align: "right"
      });
    }
  }

  // 2. Content Slides
  data.slides.forEach((slideData, index) => {
    const slide = pres.addSlide();
    slide.background = { color: "FFFFFF" };

    // Logo on every slide if enabled
    if (settings.showLogo) {
      if (data.customLogoUrl) {
        slide.addImage({
          data: data.customLogoUrl,
          x: 8.5, y: 0.2, w: 1.2, h: 0.6,
          sizing: { type: "contain", w: 1.2, h: 0.6 }
        });
      } else {
        slide.addText("IARE", {
          x: 8.5, y: 0.2, w: 1.2, h: 0.5,
          fontSize: 16, bold: true, color: "FF0000",
          align: "right"
        });
      }
    }

    // Heading with Red Underline
    slide.addText(slideData.title, {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32, bold: true, color: "000000",
      align: "left"
    });
    
    // Red Underline (using a shape or a line)
    slide.addShape("rect", {
      x: 0.5, y: 1.2, w: 4, h: 0.05,
      fill: { color: "FF0000" }
    });

    // Content Points
    const pointsText = slideData.points.map(p => `• ${p}`).join("\n\n");
    
    // If there's an image, adjust layout
    if (slideData.imageUrl) {
      slide.addText(pointsText, {
        x: 0.5, y: 1.5, w: 5.5, h: 3.5,
        fontSize: 14, color: "333333",
        align: "left", valign: "top"
      });
      
      slide.addImage({
        data: slideData.imageUrl,
        x: 6.2, y: 1.5, w: 3.3, h: 3.5,
        sizing: { type: "contain", w: 3.3, h: 3.5 }
      });
    } else {
      slide.addText(pointsText, {
        x: 0.5, y: 1.5, w: 9, h: 3.5,
        fontSize: 16, color: "333333",
        align: "left", valign: "top"
      });
    }
  });

  // Save the presentation
  try {
    const safeTopic = data.topic.replace(/[^\w\s.-]/g, "").replace(/\s+/g, "_") || "Presentation";
    await pres.writeFile({ fileName: `${safeTopic}.pptx` });
  } catch (error) {
    console.error("Failed to save PPTX:", error);
    throw error;
  }
}

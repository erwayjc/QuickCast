// Improved podcast info endpoint
app.post("/api/podcast-info", async (req, res) => {
  try {
    console.log('Received podcast info data:', req.body);

    const { hostName, targetAudience, description } = req.body;

    if (hostName === undefined) {
      return res.status(400).json({ 
        message: "Missing required field: hostName"
      });
    }

    // First check if default template exists
    const existingTemplates = await db
      .select()
      .from(schema.templates)
      .where(eq(schema.templates.name, "Default Template"));

    if (existingTemplates.length > 0) {
      // Update existing template
      console.log('Updating existing Default Template with host name and target audience');
      const [template] = await db
        .update(schema.templates)
        .set({
          hostName: hostName || '',
          targetAudience: targetAudience || '',
          updatedAt: new Date()
        })
        .where(eq(schema.templates.name, "Default Template"))
        .returning();

      return res.json({ 
        success: true, 
        hostName: template.hostName,
        targetAudience: template.targetAudience,
      });
    } else {
      // Create new template
      console.log('Creating new Default Template with host info');
      const [template] = await db
        .insert(schema.templates)
        .values({
          name: "Default Template",
          type: "intro",
          script: "Welcome to the podcast",
          backgroundMusic: "/uploads/default.mp3",
          musicVolume: 50,
          duration: 30,
          hostName: hostName || '',
          targetAudience: targetAudience || '',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return res.json({ 
        success: true, 
        hostName: template.hostName,
        targetAudience: template.targetAudience,
      });
    }
  } catch (error) {
    console.error('Error saving podcast info:', error);
    res.status(500).json({ 
      message: "Failed to save podcast information",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
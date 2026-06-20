import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Fetches the roofing hero image from the connected Google Drive account.
 * Looks for a file named "roofing-hero" or similar in the Drive.
 * Returns a shareable public URL for the image.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get the Google Drive connection
    const driveConnection = await base44.asServiceRole.connectors.getConnection('googledrive');
    
    if (!driveConnection || !driveConnection.accessToken) {
      return Response.json(
        { error: 'Google Drive not connected. Please authorize first.' },
        { status: 401 }
      );
    }

    // Search for roofing hero image in Google Drive
    const searchQuery = `name contains 'roofing' AND name contains 'hero' AND mimeType contains 'image'`;
    const filesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&spaces=drive&fields=files(id,name,webViewLink,webContentLink)&pageSize=5`,
      {
        headers: {
          Authorization: `Bearer ${driveConnection.accessToken}`,
        },
      }
    );

    const filesData = await filesResponse.json();

    if (!filesData.files || filesData.files.length === 0) {
      // Return default placeholder if no image found
      return Response.json({
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=900&fit=crop',
        fileName: 'default-roofing-placeholder',
        source: 'unsplash-default',
      });
    }

    // Return the first matching image (most recently uploaded/modified first)
    const firstImage = filesData.files[0];
    const publicUrl = firstImage.webContentLink || firstImage.webViewLink;

    console.log(`✓ Synced roofing hero image: ${firstImage.name}`);

    return Response.json({
      imageUrl: publicUrl,
      fileName: firstImage.name,
      source: 'google-drive',
      fileId: firstImage.id,
    });
  } catch (error) {
    console.error('Error syncing roofing hero image from Google Drive:', error.message);
    return Response.json(
      { 
        error: 'Failed to sync image from Google Drive',
        details: error.message,
        // Fallback to high-quality placeholder
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=900&fit=crop',
      },
      { status: 500 }
    );
  }
});
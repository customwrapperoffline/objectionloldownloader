const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Define the base URL for objection.lol videos
const baseUrl = 'https://api.objection.lol/export/getvideo?id=';

// Define the range of video IDs you want to download
const startVideoId = 1; // Starting video ID
const endVideoId = 100; // Ending video ID (adjust as needed)

// Specify the directory where you want to save the videos
const downloadDirectory = './objection-lol-videos'; // Change this to your desired directory

// Create the download directory if it doesn't exist
if (!fs.existsSync(downloadDirectory)) {
  fs.mkdirSync(downloadDirectory);
}

// Function to download a single video by its ID
async function downloadVideo(videoId) {
  const videoUrl = `${baseUrl}${videoId}`;

  try {
    const response = await axios.get(videoUrl, { responseType: 'stream' });

    // Extract the video filename from the URL
    const videoFileName = videoUrl.split('/').pop();
    
    // Define the file path where you want to save the video
    const videoFilePath = `${downloadDirectory}/${videoFileName}`;

    const writer = fs.createWriteStream(videoFilePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Downloaded: ${videoFileName}`);
        resolve();
      });

      writer.on('error', reject);
    });
  } catch (error) {
    if (error.response && error.response.status === 429) {
      // Check for the "Retry-After" header
      const retryAfterHeader = error.response.headers['retry-after'];
      
      if (retryAfterHeader) {
        const retryAfterSeconds = parseInt(retryAfterHeader, 10);
        
        // Wait for the specified duration before retrying
        console.log(`Rate limited. Waiting for ${retryAfterSeconds} seconds.`);
        await delay(retryAfterSeconds * 1000); // Convert to milliseconds
        return downloadVideo(videoId);
      }
    }
    console.error(`Error downloading video ${videoId}: ${error.message}`);
  }
}

// Function to introduce a delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Loop through the range of video IDs and download each video
async function downloadAllVideos() {
  for (let videoId = startVideoId; videoId <= endVideoId; videoId++) {
    await downloadVideo(videoId);
  }
}

// Call the function to start downloading all videos
downloadAllVideos();

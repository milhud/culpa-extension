// Function to search for professor ID based on the professor's name (this could be on the page or from an API)

// asynchronous function to get professor ID, which is needed to lookup CULPA reviews
async function getProfessorId(professorName) {
    console.log("Getting professor ID function for name: ", professorName);
    const encodedName = encodeURIComponent(professorName); // encodes name
    const searchUrl = `https://culpa.info/api/search?entity=all&limit=6&query=${encodedName}`; // pulls ID
    
    try {
        const response = await fetch(searchUrl);

        // Check for non-OK status (e.g., 404, 500)
        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        console.log("Received data:", data);

        // Check if any professors found and return the ID
        if (data.professorResults && data.professorResults.length > 0) {
            console.log("Professor ID: ", data.professorResults[0].id);
            return data.professorResults[0].id; // returns first result - the exact name
        } else {
            console.error('No professors found for name:', professorName);
            return null;
        }
    } catch (error) {
        console.error('Error searching for professor:', error);
        return null;
    }
}

  
  // Function to fetch reviews using the professor's ID
  async function getProfessorReviewsById(professorId) {
    console.log('Searching for professor reviews by ID...');
    const reviewUrl = `https://culpa.info/api/review/get/professor/${professorId}`;

    try {
        const response = await fetch(reviewUrl);
        const data = await response.json();

        // Check if reviews exist and are an array
        if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
            console.log('Reviews: ', data.reviews);
            console.log('Will return now');
            return data; // Return the reviews if they exist and are valid
        } else {
            console.error('No reviews found for professor with ID:', professorId);
            return null; // Return null if no reviews found
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return null; // Return null in case of an error
    }
}

  
    // Function to store reviews in LastName, FirstName.json format
const storeReviewsAsJson = (professorName, reviews) => {
    console.log('storing reviews as json')
    // Split the professor name into First and Last Name
    const nameParts = professorName.split(" ");
    const lastName = nameParts[nameParts.length - 1]; // Last name
    const firstName = nameParts.slice(0, -1).join(" "); // First name(s)

    // Construct the file name in LastName, FirstName.json format
    const fileName = `${lastName}, ${firstName}.json`;

    // Create the JSON object for the reviews
    const reviewData = {
        professorName,
        reviews: reviews,
    };

    // Convert to JSON and store
    const jsonData = JSON.stringify(reviewData, null, 2);
    
    // Downloads JSON file
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;  // downloads file with correct name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// Listener for receiving messages from content.js
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("Received message:", message);

    if (message.action === 'fetchReviews') {
        const professorName = message.professorName;
        console.log("Starting to fetch reviews for professor:", professorName);

        // Searching for the professor's ID
        try {
            const professorId = await getProfessorId(professorName);
            if (professorId) {

                // fetching reviews using the professor's ID
                console.log("Fetching reviews using professor ID...");
                const reviews = await getProfessorReviewsById(professorId);

                if (reviews) {
                    
                    // store reviews in chrome.storage.local
                    const professorKey = professorName.split(",").reverse().join(", "); // Format key as "LastName, FirstName"
                    console.log(`Storing reviews for ${professorName} with key: ${professorKey}`);

                    chrome.storage.local.set({ [professorKey]: reviews }, () => {
                        console.log(`Reviews for ${professorName} successfully saved to storage`);

                        // Send success response back to content.js
                        sendResponse({ success: true, message: `Reviews saved for ${professorName}` });
                    });
                } else {
                    console.error("No reviews found for professor.");
                    sendResponse({ error: 'No reviews found for professor' });
                }
            } else {
                console.error("Professor ID not found.");
                sendResponse({ error: 'Professor ID not found' });
            }
        } catch (error) {
            console.error("Error occurred during fetch:", error);
            sendResponse({ error: 'An error occurred while fetching reviews' });
        }

        // Indicate that we are sending the response asynchronously
        return true;
    }
});

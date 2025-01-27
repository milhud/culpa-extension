// Function to calculate the average review rating
function calculateAverageRating(reviews) {
    const ratings = reviews.map(review => review.rating); // Get all ratings
    const total = ratings.reduce((sum, rating) => sum + rating, 0); // Calculate sum of all ratings
    const average = total / ratings.length; // Calculate average
    return average; // Return the average
}

// Function to append the average rating or "No Reviews" next to the professor's name
function appendRatingToProfessorName(professorNameElement, averageRating, hasReviews) {
    // Create the text to append (either the average rating or "No Reviews")
    const ratingText = hasReviews ? ` - Rating: ${averageRating.toFixed(1)}` : " - No Reviews";

    // Append the rating text to the professor's name inside the <a> tag
    professorNameElement.innerText += ratingText;
}

// Function to fetch professor reviews from CULPA API via background.js
function fetchProfessorReviews(professorName) {
    if (!professorName) {
        console.log("Invalid professor name, skipping fetch.");
        return; // Skip if the professor name is empty
    }

    console.log("Sending message to background.js to fetch reviews for professor:", professorName);

    // Format the professor name for the key (LastName, FirstName)
    const professorKey = professorName.split(",").reverse().join(", ").trim();
    console.log(`Checking if reviews are already stored for ${professorName} in chrome.storage.local...`);

    // Check if the reviews are already stored in chrome.storage.local
    chrome.storage.local.get([professorKey], (result) => {
        if (result[professorKey]) {
            const reviews = result[professorKey].reviews;
            const hasReviews = reviews.length > 0;
            const averageRating = hasReviews ? calculateAverageRating(reviews) : null;

            // Find the <a> element containing the professor's name
            const professorNameElements = document.querySelectorAll('a.pointer.underline');
            professorNameElements.forEach((professorNameElement) => {
                if (professorNameElement.innerText.includes(professorName)) {
                    // Append the rating or "No Reviews" to the professor's name
                    appendRatingToProfessorName(professorNameElement, averageRating, hasReviews);
                }
            });
        } else {
            
            // Fetch reviews if not found in chrome.storage.local
            chrome.runtime.sendMessage(
                { action: 'fetchReviews', professorName },
                (response) => {
                    console.log("Response from background.js:", response);

                    if (response.success) {
                        console.log("Reviews have been successfully stored in chrome storage.");
                        // Retrieve the reviews from storage
                        chrome.storage.local.get([professorKey], (result) => {
                            if (result[professorKey]) {
                                const reviews = result[professorKey].reviews;
                                const hasReviews = reviews.length > 0;
                                const averageRating = hasReviews ? calculateAverageRating(reviews) : null;

                                // Find the <a> element containing the professor's name
                                const professorNameElements = document.querySelectorAll('a.pointer.underline');
                                professorNameElements.forEach((professorNameElement) => {
                                    if (professorNameElement.innerText.includes(professorName)) {
                                        console.log("Found professor's name in <a> tag. Appending rating.");
                                        // Append the rating or "No Reviews" to the professor's name
                                        appendRatingToProfessorName(professorNameElement, averageRating, hasReviews);
                                    }
                                });
                            }
                        });
                    } else {
                        console.log("Error:", response.error);
                        // Store "No Reviews" in case of failure
                        storeNoReviews(professorName);
                    }
                }
            );
        }
    });
}

// Function to store "No Reviews" data for a professor
function storeNoReviews(professorName) {
    const professorKey = professorName.split(",").reverse().join(", ").trim();
    const noReviewsData = { reviews: [] }; // Store an empty reviews array to indicate "No Reviews"
    
    // Save to chrome storage to prevent repeated requests
    chrome.storage.local.set({ [professorKey]: noReviewsData }, () => {
        console.log(`Stored "No Reviews" for ${professorName} in chrome.storage.local.`);
        const professorNameElements = document.querySelectorAll('a.pointer.underline');
        professorNameElements.forEach((professorNameElement) => {
            if (professorNameElement.innerText.includes(professorName)) {
                // Append "No Reviews" next to the professor's name
                appendRatingToProfessorName(professorNameElement, null, false); // false indicates no reviews
            }
        });
    });
}

// Function to format the professor's name from "Last Name, First Name" to "First Name Last Name"
function formatProfessorName(professorName) {
    const parts = professorName.split(',');
    if (parts.length === 2) {
        const [lastName, firstName] = parts.map(part => part.trim());
        const formattedName = `${firstName} ${lastName}`;
        console.log("Formatted professor name:", formattedName);
        return formattedName;
    } else {
        console.warn(`Unexpected professor name format: ${professorName}`);
        return professorName;
    }
}

// Function to get professor names and fetch reviews for them
function getProfessorNamesAndFetchReviews() {
    const professorElements = document.querySelectorAll('a.pointer.underline');
    console.log("Found professor elements in DOM:", professorElements.length);

    professorElements.forEach(element => {
        const professorName = element.innerText.split('(')[0].trim();

        // Skip processing if the professor name is empty or invalid
        if (!professorName) {
            console.log("Invalid or empty professor name, skipping.");
            return;
        }

        const formattedName = formatProfessorName(professorName);
        console.log('Finding reviews for professor:', formattedName);
        fetchProfessorReviews(formattedName);
    });
}

// Set up a MutationObserver to monitor for changes in the DOM
function observeDOMChanges() {
    const observer = new MutationObserver((mutationsList, observer) => {
        console.log("DOM change detected. Updating professor reviews...");
        // Check if any added node contains professor names
        getProfessorNamesAndFetchReviews();
    });

    // Configuration of the observer
    observer.observe(document.body, {
        childList: true,  // Observe direct children
        subtree: true,    // Observe all descendants of the body
        attributes: false,  // We are not interested in attribute changes
    });
}

// Run the function to get reviews for the professors
getProfessorNamesAndFetchReviews();

// Start observing for DOM changes (e.g., clicks, dynamic content changes)
observeDOMChanges();

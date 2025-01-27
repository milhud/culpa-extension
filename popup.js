// Function to display the professor ratings in the popup
function displayRatings() {
    const ratingListElement = document.getElementById('rating-list');
    ratingListElement.innerHTML = '';  // Clear the existing list

    // Retrieve all stored ratings
    chrome.storage.local.get(null, (storedData) => {
        for (const professorKey in storedData) {
            const professorData = storedData[professorKey];
            if (professorData.reviews && professorData.reviews.length > 0) {
                const averageRating = calculateAverageRating(professorData.reviews);
                const listItem = document.createElement('li');
                listItem.classList.add('rating-item');
                listItem.innerHTML = `<span>${professorKey}</span>: Rating: ${averageRating.toFixed(1)}`;
                ratingListElement.appendChild(listItem);
            } else {
                const listItem = document.createElement('li');
                listItem.classList.add('rating-item');
                listItem.innerHTML = `<span>${professorKey}</span>: No Reviews`;
                ratingListElement.appendChild(listItem);
            }
        }
    });
}

// Function to calculate the average rating (same logic as before)
function calculateAverageRating(reviews) {
    const ratings = reviews.map(review => review.rating);
    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    return total / ratings.length;
}

// Run the displayRatings function when the popup is opened
document.addEventListener('DOMContentLoaded', displayRatings);

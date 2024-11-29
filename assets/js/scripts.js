// assets/js/scripts.js

document.addEventListener('DOMContentLoaded', function() {
    const analyzeForm = document.getElementById('analyze-form');
    const analyzeButton = document.getElementById('analyze-button');
    const imageInput = analyzeForm.querySelector('input[name="image"]');
    const chillOptions = analyzeForm.querySelectorAll('input[name="chillOption"]');
    const descriptionInput = analyzeForm.querySelector('input[name="description"]');
    const resultDiv = document.getElementById('result');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    // Function to check if form is ready to submit
    function checkFormValidity() {
        const isOptionSelected = [...chillOptions].some(option => option.checked);
        const isImageUploaded = imageInput.files.length > 0;
        if (isOptionSelected && isImageUploaded) {
            analyzeButton.disabled = false;
        } else {
            analyzeButton.disabled = true;
        }
    }

    // Event listeners for inputs
    chillOptions.forEach(option => {
        option.addEventListener('change', checkFormValidity);
    });

    imageInput.addEventListener('change', function() {
        checkFormValidity();
        displayImagePreview(this);
    });

    // Function to display image preview
    function displayImagePreview(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(input.files[0]);
        } else {
            imagePreviewContainer.style.display = 'none';
        }
    }

    // Form submission handler
    analyzeForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const chillType = analyzeForm.querySelector('input[name="chillOption"]:checked').value;
        const description = descriptionInput.value;
        const file = imageInput.files[0];

        // Show a loading indicator
        resultDiv.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>';

        // Convert image file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function() {
            const base64Image = reader.result.split(',')[1]; // Remove data URL prefix

            const data = {
                base64Image: base64Image,
                description: description,
                chillType: chillType,
            };

            fetch('https://art-of-symbolism.onrender.com/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    resultDiv.innerHTML = `<p class="text-danger">${data.error}</p>`;
                } else {
                    resultDiv.innerHTML = `
                        <h3>${data.chillType} Percentage: ${data.percentage}%</h3>
                        <p>Traits: ${data.traits}</p>
                    `;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                resultDiv.innerHTML = '<p class="text-danger">An error occurred. Please try again later.</p>';
            });
        };
    });
});

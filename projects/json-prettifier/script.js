document.addEventListener('DOMContentLoaded', () => {
    const inputJson = document.getElementById('input-json');
    const outputJson = document.getElementById('output-json');
    const formatBtn = document.getElementById('format-btn');
    const copyBtn = document.getElementById('copy-btn');

    // Function to format JSON
    function formatJSON() {
        const input = inputJson.value.trim();
        
        if (!input) {
            outputJson.textContent = '';
            return;
        }

        try {
            // Clean the input by removing formatting
            const cleanInput = input
                .replace(/[\n\r\t]/g, '') // Remove newlines, carriage returns, and tabs
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim();

            // Parse the input to validate it's proper JSON
            const parsed = JSON.parse(cleanInput);
            // Convert back to string with proper formatting
            const formatted = JSON.stringify(parsed, null, 4);
            outputJson.textContent = formatted;
            outputJson.style.color = '#333';
        } catch (error) {
            outputJson.textContent = `Error: ${error.message}`;
            outputJson.style.color = '#dc3545';
        }
    }

    // Copy to clipboard functionality
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(outputJson.textContent);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 1500);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    });

    // Format when button is clicked
    formatBtn.addEventListener('click', formatJSON);

    // Format on input change (with debounce)
    let timeout;
    inputJson.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(formatJSON, 300);
    });

    // Add keyboard shortcut (Cmd/Ctrl + Enter)
    inputJson.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            formatJSON();
        }
    });

    // Handle Cmd/Ctrl + A selection behavior
    [inputJson, outputJson].forEach(element => {
        element.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.preventDefault();
                if (element === outputJson) {
                    // For the output pre element, we need to create a range
                    const range = document.createRange();
                    range.selectNodeContents(element);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    // For the input textarea, we can use the select() method
                    element.select();
                }
            }
        });
    });
}); 
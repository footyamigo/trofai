async function handleScrapeRequest(url) {
    try {
        const response = await fetch('/api/scrape-rightmove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to scrape property');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error scraping property:', error);
        throw error;
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        const data = await handleScrapeRequest(propertyUrl);
        // Handle successful scrape
        setScrapedData(data);
    } catch (error) {
        setError(error.message);
    } finally {
        setIsLoading(false);
    }
} 
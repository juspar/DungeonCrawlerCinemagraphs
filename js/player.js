document.addEventListener('DOMContentLoaded', () => {
    const frameA = document.getElementById('frame-a');
    const frameB = document.getElementById('frame-b');
    
    // Load playlist from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stored = urlParams.get('playlist');
    
    if (!stored) {
        // Fallback if accessed directly without a playlist
        window.location.href = "index.html";
        return;
    }

    let playlist;
    try {
        playlist = JSON.parse(decodeURIComponent(stored));
    } catch (e) {
        window.location.href = "index.html";
        return;
    }
    const scenes = playlist.scenes;
    const durationMs = playlist.durationMinutes * 60 * 1000;
    
    let currentSceneIndex = -1;
    let isFrameAActive = true;
    let intervalId;

    function getRandomScene() {
        if (scenes.length === 1) return scenes[0]; // Only 1 scene selected
        
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * scenes.length);
        } while (newIndex === currentSceneIndex); // Ensure we don't pick the same scene twice in a row
        
        currentSceneIndex = newIndex;
        return scenes[currentSceneIndex];
    }

    function loadNextScene() {
        const nextSceneUrl = getRandomScene();
        
        if (isFrameAActive) {
            // Frame A is visible, load into Frame B
            frameB.src = nextSceneUrl;
            
            // Wait for it to load, then crossfade
            frameB.onload = () => {
                frameB.classList.add('active');
                frameB.classList.remove('hidden');
                
                frameA.classList.remove('active');
                frameA.classList.add('hidden');
                isFrameAActive = false;
            };
        } else {
            // Frame B is visible, load into Frame A
            frameA.src = nextSceneUrl;
            
            frameA.onload = () => {
                frameA.classList.add('active');
                frameA.classList.remove('hidden');
                
                frameB.classList.remove('active');
                frameB.classList.add('hidden');
                isFrameAActive = true;
            };
        }
    }

    // Initial load
    frameA.src = getRandomScene();
    frameA.onload = () => {
        // Start the timer once the first scene is loaded
        if (scenes.length > 1) {
            intervalId = setInterval(loadNextScene, durationMs);
        }
    };
});

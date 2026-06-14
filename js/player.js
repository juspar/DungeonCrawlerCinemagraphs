document.addEventListener('DOMContentLoaded', () => {
    const frameA = document.getElementById('frame-a');
    const frameB = document.getElementById('frame-b');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Global sequence of all 18 chapter scenes for sequential navigation in single scene mode
    const globalScenes = [
        "scenes/scene_1_1.html",
        "scenes/scene_1_3.html",
        "scenes/scene_1_9.html",
        "scenes/scene_1_28.html",
        "scenes/scene_2_6.html",
        "scenes/scene_2_15.html",
        "scenes/scene_2_24.html",
        "scenes/scene_3_2.html",
        "scenes/scene_3_4.html",
        "scenes/scene_3_20.html",
        "scenes/scene_4_3.html",
        "scenes/scene_4_20.html",
        "scenes/scene_4_33.html",
        "scenes/scene_5_2.html",
        "scenes/scene_5_17.html",
        "scenes/scene_5_25.html",
        "scenes/scene_5_65.html",
        "scenes/scene_5_e.html"
    ];
    
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
    let intervalId = null;

    function getRandomScene() {
        if (scenes.length === 1) return scenes[0]; // Only 1 scene selected
        
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * scenes.length);
        } while (newIndex === currentSceneIndex); // Ensure we don't pick the same scene twice in a row
        
        currentSceneIndex = newIndex;
        return scenes[currentSceneIndex];
    }

    function resetTimer() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        if (scenes.length > 1 && durationMs > 0) {
            intervalId = setInterval(autoAdvance, durationMs);
        }
    }

    function autoAdvance() {
        const nextSceneUrl = getRandomScene();
        transitionToScene(nextSceneUrl);
    }

    function transitionToScene(sceneUrl) {
        resetTimer();

        if (isFrameAActive) {
            // Frame A is visible, load into Frame B
            frameB.src = sceneUrl;
            
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
            frameA.src = sceneUrl;
            
            frameA.onload = () => {
                frameA.classList.add('active');
                frameA.classList.remove('hidden');
                
                frameB.classList.remove('active');
                frameB.classList.add('hidden');
                isFrameAActive = true;
            };
        }
    }

    function navigate(direction) {
        let nextUrl;
        
        if (scenes.length > 1) {
            // Navigate within the user's selected playlist
            if (currentSceneIndex === -1) {
                const activeFrame = isFrameAActive ? frameA : frameB;
                const currentSrc = activeFrame.src;
                currentSceneIndex = scenes.findIndex(s => currentSrc.includes(s));
            }
            
            if (direction === 'next') {
                currentSceneIndex = (currentSceneIndex + 1) % scenes.length;
            } else {
                currentSceneIndex = (currentSceneIndex - 1 + scenes.length) % scenes.length;
            }
            nextUrl = scenes[currentSceneIndex];
        } else {
            // Navigate globally across all scenes
            const activeFrame = isFrameAActive ? frameA : frameB;
            const currentSrc = activeFrame.src;
            let globalIndex = globalScenes.findIndex(s => currentSrc.includes(s));
            
            if (globalIndex === -1) {
                globalIndex = 0;
            }
            
            if (direction === 'next') {
                globalIndex = (globalIndex + 1) % globalScenes.length;
            } else {
                globalIndex = (globalIndex - 1 + globalScenes.length) % globalScenes.length;
            }
            
            nextUrl = globalScenes[globalIndex];
            scenes[0] = nextUrl;
            currentSceneIndex = 0;

            // Update the URL parameter so that a refresh keeps the current scene
            const newPlaylist = {
                scenes: [nextUrl],
                durationMinutes: 0
            };
            const encodedPlaylist = encodeURIComponent(JSON.stringify(newPlaylist));
            const newUrl = `${window.location.pathname}?playlist=${encodedPlaylist}`;
            window.history.replaceState(null, '', newUrl);
        }
        
        transitionToScene(nextUrl);
    }

    // Set up button listeners
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => navigate('prev'));
        nextBtn.addEventListener('click', () => navigate('next'));
    }

    // Keydown listeners for left/right arrow keys
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            navigate('prev');
        } else if (e.key === 'ArrowRight') {
            navigate('next');
        }
    });

    // Initial load
    const initialScene = getRandomScene();
    frameA.onload = () => {
        if (scenes.length > 1) {
            currentSceneIndex = scenes.indexOf(initialScene);
        } else {
            currentSceneIndex = 0;
        }
        resetTimer();
    };
    frameA.src = initialScene;
});

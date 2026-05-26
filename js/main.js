document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const grids = document.querySelectorAll('.inventory-grid');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            grids.forEach(g => g.classList.remove('active-grid'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const targetGrid = document.getElementById(targetId);
            if (targetGrid) {
                targetGrid.classList.add('active-grid');
            }
        });
    });

    // --- PLAYLIST LOGIC ---
    let selectMode = false;
    let selectedScenes = new Set();

    const toggleBtn = document.getElementById('toggle-select-mode');
    const controlsBar = document.getElementById('playlist-controls');
    const countDisplay = document.getElementById('selection-count');
    const startBtn = document.getElementById('start-playlist');
    const durationSelect = document.getElementById('duration-select');

    toggleBtn.addEventListener('click', () => {
        selectMode = !selectMode;
        
        if (selectMode) {
            toggleBtn.textContent = "Exit Select Mode";
            toggleBtn.classList.add('active');
            controlsBar.classList.remove('hidden');
        } else {
            toggleBtn.textContent = "Enter Select Mode";
            toggleBtn.classList.remove('active');
            controlsBar.classList.add('hidden');
            // Clear selection
            selectedScenes.clear();
            document.querySelectorAll('.item-slot.selected').forEach(el => el.classList.remove('selected'));
            updateControls();
        }
    });

    const slots = document.querySelectorAll('.item-slot.selectable');
    slots.forEach(slot => {
        slot.addEventListener('click', (e) => {
            const url = slot.getAttribute('data-url');
            if (!url) return;

            if (selectMode) {
                // Prevent default navigation
                e.preventDefault();
                
                if (selectedScenes.has(url)) {
                    selectedScenes.delete(url);
                    slot.classList.remove('selected');
                } else {
                    selectedScenes.add(url);
                    slot.classList.add('selected');
                }
                updateControls();
            } else {
                // Route through the player even for a single scene so that
                // the Spotify embed and ad overlays persist across all viewing.
                const playlist = {
                    scenes: [url],
                    durationMinutes: 0 // 0 = no auto-advance for a single scene
                };
                const encodedPlaylist = encodeURIComponent(JSON.stringify(playlist));
                window.location.href = `player.html?playlist=${encodedPlaylist}`;
            }
        });
    });

    function updateControls() {
        countDisplay.textContent = selectedScenes.size;
        startBtn.disabled = selectedScenes.size === 0;
    }

    startBtn.addEventListener('click', () => {
        if (selectedScenes.size > 0) {
            const playlist = {
                scenes: Array.from(selectedScenes),
                durationMinutes: parseInt(durationSelect.value)
            };
            const encodedPlaylist = encodeURIComponent(JSON.stringify(playlist));
            window.location.href = `player.html?playlist=${encodedPlaylist}`;
        }
    });
});

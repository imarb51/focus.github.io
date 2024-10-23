
let videos = JSON.parse(localStorage.getItem('videos')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let noteIdCounter = parseInt(localStorage.getItem('noteIdCounter')) || 0;
let isNotesPanelOpen = false;

function getVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function addVideo() {
    const urlInput = document.getElementById('videoUrl');
    const url = urlInput.value.trim();
    const videoId = getVideoId(url);

    if (videoId) {
        const videoData = {
            id: videoId,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            title: `Video ${videos.length + 1}`
        };

        videos.push(videoData);
        localStorage.setItem('videos', JSON.stringify(videos));
        displayVideos();
        urlInput.value = '';
    } else {
        alert('Please enter a valid YouTube URL');
    }
}

function displayVideos() {
    const gallery = document.getElementById('videoGallery');
    gallery.innerHTML = '';

    videos.forEach((video, index) => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}" style="width: 100%;">
            </div>
            <div class="video-info p-3">
                <div class="video-title">${video.title}</div>
            </div>
        `;
        videoCard.onclick = () => playVideo(video.id);
        gallery.appendChild(videoCard);
    });
}

function playVideo(videoId) {
    const playerContainer = document.getElementById('videoPlayerContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    
    videoPlayer.innerHTML = `
        <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1"
            allowfullscreen
            allow="autoplay"
        ></iframe>
    `;
    
    playerContainer.style.display = 'flex';
}

function closeVideo() {
    const playerContainer = document.getElementById('videoPlayerContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    
    videoPlayer.innerHTML = '';
    playerContainer.style.display = 'none';
}

function createNote(inPlayer = false) {
    noteIdCounter++;
    localStorage.setItem('noteIdCounter', noteIdCounter);

    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.id = `note-${noteIdCounter}`;
    
    if (inPlayer) {
        note.style.top = '100px';
        note.style.left = '20px';
    } else {
        note.style.top = '50%';
        note.style.left = '50%';
    }
    
    note.innerHTML = `
        <div class="note-controls">
            <button onclick="saveNote(${noteIdCounter})">
                <i class="fas fa-save"></i>
            </button>
            <button onclick="closeNote(${noteIdCounter})">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <textarea placeholder="Write your note here..."></textarea>
    `;

    if (inPlayer) {
        document.querySelector('.video-player-container').appendChild(note);
    } else {
        document.body.appendChild(note);
    }
    
    $(note).draggable({
        containment: inPlayer ? '.video-player-container' : 'window'
    });
}

function createNoteInPlayer() {
    createNote(true);
}

function saveNote(id) {
    const noteElement = document.getElementById(`note-${id}`);
    const noteText = noteElement.querySelector('textarea').value;
    
    if (noteText.trim()) {
        notes.push({
            id: id,
            text: noteText,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('notes', JSON.stringify(notes));
        displaySavedNotes();
    }
    
    closeNote(id);
}

function closeNote(id) {
    const noteElement = document.getElementById(`note-${id}`);
    if (noteElement) {
        noteElement.remove();
    }
}

function displaySavedNotes() {
    const savedNotesContainer = document.getElementById('savedNotes');
    savedNotesContainer.innerHTML = '';

    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'saved-note';
        noteElement.innerHTML = `
            <p>${note.text}</p>
            <button class="delete-note" onclick="deleteNote(${note.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        savedNotesContainer.appendChild(noteElement);
    });
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('notes', JSON.stringify(notes));
    displaySavedNotes();
}

function toggleNotesPanel() {
    const notesPanel = document.getElementById('notesPanel');
    isNotesPanelOpen = !isNotesPanelOpen;
    
    if (isNotesPanelOpen) {
        notesPanel.classList.add('active');
        displaySavedNotes();
    } else {
        notesPanel.classList.remove('active');
    }
}

// Handle escape key to close video player and notes
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeVideo();
        const notes = document.querySelectorAll('.sticky-note');
        notes.forEach(note => note.remove());
    }
});

// Handle clicking outside video player to close it
document.getElementById('videoPlayerContainer').addEventListener('click', (event) => {
    if (event.target.id === 'videoPlayerContainer') {
        closeVideo();
    }
});

// Initialize the display
window.onload = () => {
    displayVideos();
    displaySavedNotes();
};

// Export functionality for backup
function exportData() {
    const data = {
        videos: videos,
        notes: notes,
        noteIdCounter: noteIdCounter
    };
    
    const dataStr = JSON.stringify(data);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'youtube-gallery-backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Import functionality for restoration
function importData(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (data.videos && data.notes && typeof data.noteIdCounter === 'number') {
                videos = data.videos;
                notes = data.notes;
                noteIdCounter = data.noteIdCounter;
                
                // Update localStorage
                localStorage.setItem('videos', JSON.stringify(videos));
                localStorage.setItem('notes', JSON.stringify(notes));
                localStorage.setItem('noteIdCounter', noteIdCounter);
                
                // Refresh displays
                displayVideos();
                displaySavedNotes();
                
                alert('Data imported successfully!');
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            alert('Error importing data. Please check the file format.');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
}

// Search functionality
function searchVideos(query) {
    const searchTerm = query.toLowerCase();
    const filteredVideos = videos.filter(video => 
        video.title.toLowerCase().includes(searchTerm)
    );
    
    const gallery = document.getElementById('videoGallery');
    gallery.innerHTML = '';
    
    filteredVideos.forEach((video, index) => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}" style="width: 100%;">
            </div>
            <div class="video-info p-3">
                <div class="video-title">${video.title}</div>
            </div>
        `;
        videoCard.onclick = () => playVideo(video.id);
        gallery.appendChild(videoCard);
    });
}

// Search notes functionality
function searchNotes(query) {
    const searchTerm = query.toLowerCase();
    const filteredNotes = notes.filter(note =>
        note.text.toLowerCase().includes(searchTerm)
    );
    
    const savedNotesContainer = document.getElementById('savedNotes');
    savedNotesContainer.innerHTML = '';
    
    filteredNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'saved-note';
        noteElement.innerHTML = `
            <p>${note.text}</p>
            <button class="delete-note" onclick="deleteNote(${note.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        savedNotesContainer.appendChild(noteElement);
    });
}

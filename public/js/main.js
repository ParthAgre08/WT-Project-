/**
 * MSRTC Bus Booking System - Frontend Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const fromCityInput = document.getElementById('fromCity');
  const toCityInput = document.getElementById('toCity');
  const swapCitiesBtn = document.getElementById('swapCitiesBtn');
  const journeyDateInput = document.getElementById('journeyDate');
  const voiceMicBtn = document.getElementById('voiceMicBtn');
  const voiceSearchInput = document.getElementById('voiceSearchInput');
  const voiceStatusText = document.getElementById('voiceStatusText');
  const bookingForm = document.getElementById('busBookingForm');

  // =========================================================================
  // 1. Date Constraints & Default Values
  // =========================================================================
  if (journeyDateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${yyyy}-${mm}-${dd}`;

    // Prevent selecting past dates
    journeyDateInput.setAttribute('min', todayFormatted);

    // Set default value to today if not already set
    if (!journeyDateInput.value) {
      journeyDateInput.value = todayFormatted;
    }
  }

  // =========================================================================
  // 2. Origin & Destination Swap Button
  // =========================================================================
  if (swapCitiesBtn && fromCityInput && toCityInput) {
    swapCitiesBtn.addEventListener('click', () => {
      const temp = fromCityInput.value;
      fromCityInput.value = toCityInput.value;
      toCityInput.value = temp;

      // Animate swap button
      swapCitiesBtn.style.transform = 'rotate(180deg)';
      setTimeout(() => {
        swapCitiesBtn.style.transform = '';
      }, 300);
    });
  }

  // =========================================================================
  // 3. Web Speech Recognition (Voice Search)
  // =========================================================================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (voiceMicBtn && voiceSearchInput) {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-IN'; // English (India) / also understands Indian city accents
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let isListening = false;

      voiceMicBtn.addEventListener('click', () => {
        if (isListening) {
          recognition.stop();
          return;
        }

        try {
          recognition.start();
        } catch (err) {
          console.warn('Speech recognition start failed or already active:', err);
        }
      });

      recognition.onstart = () => {
        isListening = true;
        voiceMicBtn.classList.add('listening');
        voiceStatusText.textContent = 'Listening... Speak your query';
        voiceSearchInput.placeholder = 'Listening... e.g. "Pune to Mumbai tomorrow"';
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        voiceSearchInput.value = transcript;
        voiceStatusText.textContent = `Processing query: "${transcript}"...`;

        // Send spoken text to backend GET route /find-buses?text=...
        window.location.href = `/find-buses?text=${encodeURIComponent(transcript)}`;
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        voiceStatusText.textContent = 'Could not hear clearly. Try again.';
      };

      recognition.onend = () => {
        isListening = false;
        voiceMicBtn.classList.remove('listening');
        setTimeout(() => {
          if (voiceStatusText.textContent.includes('Listening')) {
            voiceStatusText.textContent = 'Voice-based search';
          }
        }, 3000);
      };

      // Allow pressing Enter in the voice input box to send query
      voiceSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = voiceSearchInput.value.trim();
          if (query) {
            window.location.href = `/find-buses?text=${encodeURIComponent(query)}`;
          }
        }
      });
    } else {
      // Speech recognition not supported in browser
      voiceMicBtn.addEventListener('click', () => {
        voiceStatusText.textContent = 'Voice recognition not supported in this browser';
        voiceSearchInput.focus();
      });
    }
  }

  // =========================================================================
  // 4. Form Validation & UX
  // =========================================================================
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      const fromVal = fromCityInput.value.trim().toLowerCase();
      const toVal = toCityInput.value.trim().toLowerCase();

      if (fromVal && toVal && fromVal === toVal) {
        e.preventDefault();
        alert('Departure and Destination cannot be the same city!');
        toCityInput.focus();
      }
    });
  }
});


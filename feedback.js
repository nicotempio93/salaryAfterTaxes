import { db } from './config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackText = document.getElementById('feedback');

    // Agregar contador de caracteres
    feedbackText.addEventListener('input', () => {
        const remaining = 500 - feedbackText.value.length;
        if (remaining < 0) {
            feedbackText.value = feedbackText.value.substring(0, 500);
        }
    });

    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const feedback = feedbackText.value.trim();
        
        // Validaciones
        if (!feedback) {
            alert('Por favor, escribe tu feedback antes de enviar.');
            return;
        }
        
        if (feedback.length > 500) {
            alert('El feedback no puede exceder los 500 caracteres.');
            return;
        }

        try {
            // Crear objeto con el feedback y timestamp
            const feedbackData = {
                mensaje: feedback,
                fecha: new Date(),
                pagina: window.location.pathname // Para saber de qué página viene el feedback
            };

            // Enviar a Firestore
            await addDoc(collection(db, 'feedback'), feedbackData);
            
            // Mostrar mensaje de éxito
            alert('¡Gracias por tu feedback!');
            
            // Limpiar el formulario
            feedbackForm.reset();

        } catch (error) {
            console.error('Error al enviar feedback:', error);
            alert('Hubo un error al enviar tu feedback. Por favor, intenta nuevamente.');
        }
    });
}); 
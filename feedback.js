import { db } from './config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


document.addEventListener('DOMContentLoaded', function() {


    const feedbackForm = document.getElementById('feedback-form');
    const feedbackText = document.getElementById('feedback');
    const feedbackToggle = document.getElementById('feedback-toggle');
    const feedbackContent = document.querySelector('.feedback-content');
    const feedbackSection = document.querySelector('.feedback-section');

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


    if (feedbackToggle && feedbackSection) {
        console.log('Elementos encontrados, agregando event listener');
        
        feedbackToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            feedbackSection.classList.toggle('active');
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (feedbackSection.classList.contains('active') && 
                !feedbackContent.contains(e.target) && 
                !feedbackToggle.contains(e.target)) {
                feedbackSection.classList.remove('active');
            }
        });
    } else {
        console.log('No se encontraron los elementos necesarios');
    }
});
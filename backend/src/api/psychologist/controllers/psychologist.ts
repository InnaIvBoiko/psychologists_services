/**
 * psychologist controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::psychologist.psychologist', ({ strapi }) => ({
  async toggleFavorite(ctx) {
    try {
      // Ottengo l'ID dell'utente loggato (decifrato dal JWT token)
      const userId = ctx.state.user?.id;
      if (!userId) {
        return ctx.unauthorized("Devi essere loggato per gestire i preferiti.");
      }

      // L'id dello psicologo viene dall'url (/psychologists/:id/toggle-favorite)
      // Nota: questo è di solito il documentId in Strapi v5, dipende da come il frontend manda la richiesta
      const { id } = ctx.params;

      // Recupero l'utente completo per leggere `psy_favorites`
      const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', userId);
      
      if (!fullUser) {
        return ctx.notFound("Utente non trovato.");
      }

      // Leggo i preferiti attuali (assumendo che sia salvato come array di ID o stringhe)
      // Se è null, uso un array vuoto
      let favorites = fullUser.psy_favorites || [];
      
      // Assicuriamoci che sia un array (a volte i campi JSON vengono letti/scritti come stringhe)
      if (typeof favorites === 'string') {
        try {
          favorites = JSON.parse(favorites);
        } catch(e) {
          favorites = [];
        }
      }
      if (!Array.isArray(favorites)) {
        favorites = [];
      }

      const isAlreadyFavorite = favorites.includes(id);

      let updatedFavorites;

      if (isAlreadyFavorite) {
        // Rimuovo dal JSON
        updatedFavorites = favorites.filter((favId) => favId !== id);
      } else {
        // Aggiungo al JSON
        updatedFavorites = [...favorites, id];
      }

      // Salvo l'utente
      await strapi.entityService.update('plugin::users-permissions.user', userId, {
        data: {
          psy_favorites: updatedFavorites,
        } as any,
      });

      return ctx.send({
        isFavorite: !isAlreadyFavorite,
        message: isAlreadyFavorite ? "Rimosso dai preferiti" : "Aggiunto ai preferiti"
      });
    } catch (err) {
      console.error(err);
      return ctx.internalServerError("Errore durante l'aggiornamento dei preferiti");
    }
  }
}));

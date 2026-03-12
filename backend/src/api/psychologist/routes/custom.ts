export default {
  routes: [
    {
      method: 'POST',
      path: '/psychologists/:id/toggle-favorite',
      handler: 'psychologist.toggleFavorite', // refers to api::psychologist.psychologist.toggleFavorite
    },
  ],
};

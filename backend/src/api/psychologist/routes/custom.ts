export default {
  routes: [
    {
      method: 'POST',
      path: '/psychologists/:id/toggle-favorite',
      handler: 'psychologist.toggleFavorite',
    },
    {
      method: 'POST',
      path: '/psychologists/:id/add-review',
      handler: 'psychologist.addReview',
    },
    {
      method: 'POST',
      path: '/users/dismiss-review',
      handler: 'psychologist.dismissReview',
    },
  ],
};

import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // DELETE /api/users/me/delete-account
    // Deletes all appointments for the user, then deletes the user account.
    strapi.server.router.delete('/api/users/me/delete-account', async (ctx) => {
      const authHeader = ctx.headers['authorization'] as string | undefined;
      if (!authHeader?.startsWith('Bearer ')) {
        return ctx.unauthorized('No token provided');
      }
      const token = authHeader.replace('Bearer ', '');

      let userId: number;
      try {
        const jwtService = strapi.plugin('users-permissions').service('jwt');
        const decoded = await jwtService.verify(token);
        userId = decoded.id;
      } catch {
        return ctx.unauthorized('Invalid or expired token');
      }

      const user = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({ where: { id: userId } });

      if (!user) return ctx.notFound('User not found');

      // Delete all appointments belonging to this user
      const appointments = await strapi.db
        .query('api::appointment.appointment')
        .findMany({ where: { email: user.email } });

      for (const apt of appointments) {
        await strapi.db
          .query('api::appointment.appointment')
          .delete({ where: { id: apt.id } });
      }

      // Delete the user account
      await strapi.db
        .query('plugin::users-permissions.user')
        .delete({ where: { id: userId } });

      ctx.status = 200;
      ctx.body = { message: 'Account deleted successfully' };
    });
  },
};

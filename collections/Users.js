/** @type {import('payload').CollectionConfig} */
export const Users = {
  slug: 'users',
  auth: true,
  admin: {
    group: 'Settings',
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'publishingEnabled'],
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // The very first account must be an admin, otherwise nobody can
        // manage roles or publish content.
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users' })
          if (totalDocs === 0) {
            return { ...data, role: 'admin', publishingEnabled: true }
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        // Only admins may grant or change roles.
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'publishingEnabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Allow publishing',
      admin: {
        position: 'sidebar',
        description:
          'Editors can save drafts. Tick this to let them publish. Admins always can.',
      },
      access: {
        // Only admins may toggle the publishing permission.
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
}

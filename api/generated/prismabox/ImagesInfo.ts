import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ImagesInfoPlain = t.Object(
  {
    id: t.String(),
    projectId: t.String(),
    group: t.String(),
    path: t.String(),
    marks: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const ImagesInfoRelations = t.Object(
  {
    project: t.Object(
      {
        id: t.String(),
        title: t.String(),
        dir: t.String(),
        config: t.String(),
        groups: t.String(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const ImagesInfoPlainInputCreate = t.Object(
  {
    group: t.String(),
    path: t.String(),
    marks: t.Optional(t.String()),
    updatedAt: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const ImagesInfoPlainInputUpdate = t.Object(
  {
    group: t.Optional(t.String()),
    path: t.Optional(t.String()),
    marks: t.Optional(t.String()),
    updatedAt: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const ImagesInfoRelationsInputCreate = t.Object(
  {
    project: t.Object(
      {
        connect: t.Object(
          {
            id: t.String({ additionalProperties: false }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const ImagesInfoRelationsInputUpdate = t.Partial(
  t.Object(
    {
      project: t.Object(
        {
          connect: t.Object(
            {
              id: t.String({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    },
    { additionalProperties: false },
  ),
);

export const ImagesInfoWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          projectId: t.String(),
          group: t.String(),
          path: t.String(),
          marks: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "ImagesInfo" },
  ),
);

export const ImagesInfoWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object({ id: t.String() }, { additionalProperties: false }),
          { additionalProperties: false },
        ),
        t.Union([t.Object({ id: t.String() })], {
          additionalProperties: false,
        }),
        t.Partial(
          t.Object({
            AND: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            NOT: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.String(),
              projectId: t.String(),
              group: t.String(),
              path: t.String(),
              marks: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "ImagesInfo" },
);

export const ImagesInfoSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      projectId: t.Boolean(),
      group: t.Boolean(),
      path: t.Boolean(),
      marks: t.Boolean(),
      project: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ImagesInfoInclude = t.Partial(
  t.Object(
    { project: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const ImagesInfoOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      projectId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      group: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      path: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      marks: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      updatedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const ImagesInfo = t.Composite([ImagesInfoPlain, ImagesInfoRelations], {
  additionalProperties: false,
});

export const ImagesInfoInputCreate = t.Composite(
  [ImagesInfoPlainInputCreate, ImagesInfoRelationsInputCreate],
  { additionalProperties: false },
);

export const ImagesInfoInputUpdate = t.Composite(
  [ImagesInfoPlainInputUpdate, ImagesInfoRelationsInputUpdate],
  { additionalProperties: false },
);

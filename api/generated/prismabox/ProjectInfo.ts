import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ProjectInfoPlain = t.Object(
  {
    id: t.String(),
    title: t.String(),
    dir: t.String(),
    config: t.String(),
    groups: t.String(),
  },
  { additionalProperties: false },
);

export const ProjectInfoRelations = t.Object(
  {
    labels: t.Array(
      t.Object(
        {
          id: t.String(),
          label: t.String(),
          nth: t.Integer(),
          projectId: t.String(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    images: t.Array(
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
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const ProjectInfoPlainInputCreate = t.Object(
  {
    title: t.String(),
    dir: t.String(),
    config: t.Optional(t.String()),
    groups: t.Optional(t.String()),
  },
  { additionalProperties: false },
);

export const ProjectInfoPlainInputUpdate = t.Object(
  {
    title: t.Optional(t.String()),
    dir: t.Optional(t.String()),
    config: t.Optional(t.String()),
    groups: t.Optional(t.String()),
  },
  { additionalProperties: false },
);

export const ProjectInfoRelationsInputCreate = t.Object(
  {
    labels: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    images: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const ProjectInfoRelationsInputUpdate = t.Partial(
  t.Object(
    {
      labels: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      images: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

export const ProjectInfoWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          title: t.String(),
          dir: t.String(),
          config: t.String(),
          groups: t.String(),
        },
        { additionalProperties: false },
      ),
    { $id: "ProjectInfo" },
  ),
);

export const ProjectInfoWhereUnique = t.Recursive(
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
              title: t.String(),
              dir: t.String(),
              config: t.String(),
              groups: t.String(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "ProjectInfo" },
);

export const ProjectInfoSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      title: t.Boolean(),
      dir: t.Boolean(),
      config: t.Boolean(),
      labels: t.Boolean(),
      images: t.Boolean(),
      groups: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ProjectInfoInclude = t.Partial(
  t.Object(
    { labels: t.Boolean(), images: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const ProjectInfoOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      title: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      dir: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      config: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      groups: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const ProjectInfo = t.Composite(
  [ProjectInfoPlain, ProjectInfoRelations],
  { additionalProperties: false },
);

export const ProjectInfoInputCreate = t.Composite(
  [ProjectInfoPlainInputCreate, ProjectInfoRelationsInputCreate],
  { additionalProperties: false },
);

export const ProjectInfoInputUpdate = t.Composite(
  [ProjectInfoPlainInputUpdate, ProjectInfoRelationsInputUpdate],
  { additionalProperties: false },
);

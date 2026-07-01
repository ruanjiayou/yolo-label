import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const LabelsInfoPlain = t.Object(
  {
    id: t.String(),
    label: t.String(),
    nth: t.Integer(),
    projectId: t.String(),
  },
  { additionalProperties: false },
);

export const LabelsInfoRelations = t.Object(
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

export const LabelsInfoPlainInputCreate = t.Object(
  { label: t.String(), nth: t.Integer() },
  { additionalProperties: false },
);

export const LabelsInfoPlainInputUpdate = t.Object(
  { label: t.Optional(t.String()), nth: t.Optional(t.Integer()) },
  { additionalProperties: false },
);

export const LabelsInfoRelationsInputCreate = t.Object(
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

export const LabelsInfoRelationsInputUpdate = t.Partial(
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

export const LabelsInfoWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          label: t.String(),
          nth: t.Integer(),
          projectId: t.String(),
        },
        { additionalProperties: false },
      ),
    { $id: "LabelsInfo" },
  ),
);

export const LabelsInfoWhereUnique = t.Recursive(
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
              label: t.String(),
              nth: t.Integer(),
              projectId: t.String(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "LabelsInfo" },
);

export const LabelsInfoSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      label: t.Boolean(),
      nth: t.Boolean(),
      projectId: t.Boolean(),
      project: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const LabelsInfoInclude = t.Partial(
  t.Object(
    { project: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const LabelsInfoOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      label: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      nth: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      projectId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const LabelsInfo = t.Composite([LabelsInfoPlain, LabelsInfoRelations], {
  additionalProperties: false,
});

export const LabelsInfoInputCreate = t.Composite(
  [LabelsInfoPlainInputCreate, LabelsInfoRelationsInputCreate],
  { additionalProperties: false },
);

export const LabelsInfoInputUpdate = t.Composite(
  [LabelsInfoPlainInputUpdate, LabelsInfoRelationsInputUpdate],
  { additionalProperties: false },
);

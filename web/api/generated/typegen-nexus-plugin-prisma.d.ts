import * as Typegen from 'nexus-plugin-prisma/typegen'
import * as Prisma from '@prisma/client';

// Pagination type
type Pagination = {
    first?: boolean
    last?: boolean
    before?: boolean
    after?: boolean
}

// Prisma custom scalar names
type CustomScalars = 'No custom scalars are used in your Prisma Schema.'

// Prisma model type definitions
interface PrismaModels {
  Dummy: Prisma.Dummy
}

// Prisma input types metadata
interface NexusPrismaInputs {
  Query: {
    dummies: {
      filtering: 'AND' | 'OR' | 'NOT' | 'id' | 'name'
      ordering: 'id' | 'name'
    }
  },
  Dummy: {

  }
}

// Prisma output types metadata
interface NexusPrismaOutputs {
  Query: {
    dummy: 'Dummy'
    dummies: 'Dummy'
  },
  Mutation: {
    createOneDummy: 'Dummy'
    updateOneDummy: 'Dummy'
    updateManyDummy: 'AffectedRowsOutput'
    deleteOneDummy: 'Dummy'
    deleteManyDummy: 'AffectedRowsOutput'
    upsertOneDummy: 'Dummy'
  },
  Dummy: {
    id: 'String'
    name: 'String'
  }
}

// Helper to gather all methods relative to a model
interface NexusPrismaMethods {
  Dummy: Typegen.NexusPrismaFields<'Dummy'>
  Query: Typegen.NexusPrismaFields<'Query'>
  Mutation: Typegen.NexusPrismaFields<'Mutation'>
}

interface NexusPrismaGenTypes {
  inputs: NexusPrismaInputs
  outputs: NexusPrismaOutputs
  methods: NexusPrismaMethods
  models: PrismaModels
  pagination: Pagination
  scalars: CustomScalars
}

declare global {
  interface NexusPrismaGen extends NexusPrismaGenTypes {}

  type NexusPrisma<
    TypeName extends string,
    ModelOrCrud extends 'model' | 'crud'
  > = Typegen.GetNexusPrisma<TypeName, ModelOrCrud>;
}
  
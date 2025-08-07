import { gql } from 'graphql-tag';

export const typeDefs = gql`

  enum Continent {
    africa
    asia
    europe
    northamerica
    southamerica
    oceania
  }

  enum AnimalCategory {
    mammals
    birds
    reptiles
    amphibians
    fish
    insects
  }

  type Country {
    id: ID!
    name: String!
    capital: String
    population: Int
    area: Float
    currency: String
    continent: Continent!
  }

  type Animal {
    id: ID!
    name: String!
    species: String
    habitat: String
    diet: String
    conservation_status: String
    category: AnimalCategory!
  }


  type Query {
    countries: [Country!]!
    country(id: ID!): Country
    animals: [Animal!]!
    animal(id: ID!): Animal
  }

  type Mutation {
    createCountry(
      name: String!,
      capital: String,
      population: Int,
      area: Float,
      currency: String,
      continent: Continent!
    ): Country!
    updateCountry(
      id: ID!,
      name: String,
      capital: String,
      population: Int,
      area: Float,
      currency: String,
      continent: Continent
    ): Country
    deleteCountry(id: ID!): Country

    createAnimal(
      name: String!,
      species: String,
      habitat: String,
      diet: String,
      conservation_status: String,
      category: AnimalCategory!
    ): Animal!
    updateAnimal(
      id: ID!,
      name: String,
      species: String,
      habitat: String,
      diet: String,
      conservation_status: String,
      category: AnimalCategory
    ): Animal
    deleteAnimal(id: ID!): Animal
  }
`;

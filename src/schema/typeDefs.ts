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



  input CountryFilter {
    continent: Continent
    populationMin: Int
    populationMax: Int
    areaMin: Float
    areaMax: Float
    name: String
    capital: String
    currency: String
  }

  input AnimalFilter {
    category: AnimalCategory
    species: String
    habitat: String
    diet: String
    conservation_status: String
    name: String
  }

  type Query {
    countries(search: String, filter: CountryFilter): [Country!]!
    country(id: ID!): Country
    animals(search: String, filter: AnimalFilter): [Animal!]!
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

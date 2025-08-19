export const typeDefs = `
  """
  Opaque cursor token (base64-encoded payload from the last item on a page).
  Clients must treat this as an unreadable token.
  """
  scalar Cursor

  """
  ISO8601-formatted date-time string for audit fields.
  """
  scalar DateTime

  """
  All continents supported by the API for classification of countries.
  """
  enum Continent {
    africa
    asia
    europe
    northamerica
    southamerica
    oceania
  }

  """
  Categories for classifying animals.
  """
  enum AnimalCategory {
    mammals
    birds
    reptiles
    amphibians
    fish
    insects
  }

  """
  Country information including identifiers, demographics, and geography.
  """
  type Country {
    id: ID!
    name: String!
    capital: String
    population: Int
    area: Float
    currency: String
    continent: Continent!
    createdAt: DateTime!
    modifiedAt: DateTime!
    createdBy: Int!
    modifiedBy: Int!
  }

  """
  Animal information including biological, ecological, and conservation details.
  """
  type Animal {
    id: ID!
    name: String!
    species: String
    habitat: String
    diet: String
    conservation_status: String
    category: AnimalCategory!
    createdAt: DateTime!
    modifiedAt: DateTime!
    createdBy: Int!
    modifiedBy: Int!
  }

  """
  User information for authenticated actors of the system.
  """
  type User {
    id: ID!
    username: String!
    email: String!
    firstName: String
    lastName: String
    createdAt: DateTime!
    modifiedAt: DateTime!
  }

  """
  Pagination metadata returned with any paginated list.
  Indicates whether more data exists and provides cursors for navigation.
  """
  type Pagination {
    hasNext: Boolean!
    hasPrevious: Boolean!
    startCursor: Cursor
    endCursor: Cursor
    """
    Optional total count for the dataset matching the current query/filter.
    May be expensive to compute; implement only if performance allows.
    """
    totalCount: Int
  }

  """
  Common cursor-based pagination arguments.
  Use either forward pagination (first/after) or backward pagination (last/before), not both.
  """
  input PageArgs {
    first: Int
    after: Cursor
    last: Int
    before: Cursor
  }

  """
  Sort direction for ordered results.
  """
  enum SortDirection {
    ASC
    DESC
  }

  """
  Sortable fields for countries.
  Used with CountryOrder to control result ordering.
  """
  enum CountryOrderField {
    NAME
    POPULATION
    AREA
    ID
  }

  """
  Defines ordering of country results.
  """
  input CountryOrder {
    field: CountryOrderField! = NAME
    direction: SortDirection! = ASC
  }

  """
  Sortable fields for animals.
  Used with AnimalOrder to control result ordering.
  """
  enum AnimalOrderField {
    NAME
    SPECIES
    CATEGORY
    ID
  }

  """
  Defines ordering of animal results.
  """
  input AnimalOrder {
    field: AnimalOrderField! = NAME
    direction: SortDirection! = ASC
  }

  """
  Filters for narrowing country search results.
  All fields are optional; only supplied filters will be applied.
  """
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

  """
  Filters for narrowing animal search results.
  All fields are optional; only supplied filters will be applied.
  """
  input AnimalFilter {
    category: AnimalCategory
    species: String
    habitat: String
    diet: String
    conservation_status: String
    name: String
  }

  """
  Paginated list of countries, including the data and pagination metadata.
  """
  type CountryPage {
    data: [Country!]!
    pagination: Pagination!
  }

  """
  Paginated list of animals, including the data and pagination metadata.
  """
  type AnimalPage {
    data: [Animal!]!
    pagination: Pagination!
  }

  """
  Paginated list of users.
  """
  type UserPage {
    data: [User!]!
    pagination: Pagination!
  }

  input UserFilter {
    username: String
    email: String
    firstName: String
    lastName: String
  }

  input UserOrder {
    field: String! = "username"
    direction: SortDirection! = ASC
  }

  input CreateUserInput {
    username: String!
    email: String!
    firstName: String
    lastName: String
  }

  input UpdateUserInput {
    id: ID!
    username: String
    email: String
    firstName: String
    lastName: String
  }

  type Query {
    """
    Returns a paginated list of countries with optional search, filtering, and ordering.
    """
    countriesPaginated(
      search: String,
      filter: CountryFilter,
      orderBy: CountryOrder = { field: NAME, direction: ASC },
      args: PageArgs = { first: 20 }
    ): CountryPage!

    """
    Returns a paginated list of animals with optional search, filtering, and ordering.
    """
    animalsPaginated(
      search: String,
      filter: AnimalFilter,
      orderBy: AnimalOrder = { field: NAME, direction: ASC },
      args: PageArgs = { first: 20 }
    ): AnimalPage!

    """
    Returns a paginated list of users.
    """
    usersPaginated(
      search: String,
      filter: UserFilter,
      orderBy: UserOrder = { field: "username", direction: ASC },
      args: PageArgs = { first: 20 }
    ): UserPage!

    """
    Returns all countries matching optional search and filters.
    Deprecated in favor of countriesPaginated for performance and scalability.
    """
    countries(search: String, filter: CountryFilter): [Country!]! @deprecated(reason: "Use countriesPaginated")

    """
    Returns all animals matching optional search and filters.
    Deprecated in favor of animalsPaginated for performance and scalability.
    """
    animals(search: String, filter: AnimalFilter): [Animal!]! @deprecated(reason: "Use animalsPaginated")

    """
    Returns a single country by its unique ID.
    """
    country(id: ID!): Country

    """
    Returns a single animal by its unique ID.
    """
    animal(id: ID!): Animal

    """
    Returns a single user by its unique ID.
    """
    user(id: ID!): User
  }

  type Mutation {
    """
    Creates a new country with the specified details.
    """
    createCountry(
      name: String!,
      capital: String,
      population: Int,
      area: Float,
      currency: String,
      continent: Continent!
    ): Country!

    """
    Updates an existing country by its ID with provided fields.
    """
    updateCountry(
      id: ID!,
      name: String,
      capital: String,
      population: Int,
      area: Float,
      currency: String,
      continent: Continent
    ): Country

    """
    Deletes a country by its unique ID.
    """
    deleteCountry(id: ID!): Country

    """
    Creates a new animal with the specified details.
    """
    createAnimal(
      name: String!,
      species: String,
      habitat: String,
      diet: String,
      conservation_status: String,
      category: AnimalCategory!
    ): Animal!

    """
    Updates an existing animal by its ID with provided fields.
    """
    updateAnimal(
      id: ID!,
      name: String,
      species: String,
      habitat: String,
      diet: String,
      conservation_status: String,
      category: AnimalCategory
    ): Animal

    """
    Deletes an animal by its unique ID.
    """
    deleteAnimal(id: ID!): Animal

    """
    Creates a new user.
    """
    createUser(input: CreateUserInput!): User!

    """
    Updates an existing user.
    """
    updateUser(input: UpdateUserInput!): User

    """
    Deletes a user by ID.
    """
    deleteUser(id: ID!): User
  }
`;

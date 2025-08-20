export const typeDefs = `
  # =============================================================================
  # SCALARS
  # =============================================================================

  """
  Opaque cursor token (base64-encoded payload from the last item on a page).
  Clients must treat this as an unreadable token.
  """
  scalar Cursor

  """
  ISO8601-formatted date-time string for audit fields.
  """
  scalar DateTime

  # =============================================================================
  # INTERFACES
  # =============================================================================

  """
  Common interface for all entities with audit fields.
  Provides standard identification and tracking capabilities.
  """
  interface Node {
    id: ID!
    createdAt: DateTime!
    modifiedAt: DateTime!
    createdBy: User
    modifiedBy: User
  }

  """
  Common interface for all paginated result types.
  Ensures consistent pagination structure across all entities.
  """
  interface Page {
    pagination: Pagination!
  }

  """
  Common interface for ordering input types.
  Ensures consistent ordering structure across all entities.
  """
  # Note: GraphQL SDL does not allow input types to implement interfaces.
  # Use an 'input' type to provide a shared shape for ordering args instead.
  input OrderInput {
    direction: SortDirection!
  }

  # =============================================================================
  # ENUMS
  # =============================================================================

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
  Sort direction for ordered results.
  """
  enum SortDirection {
    ASC
    DESC
  }

  """
  Sortable fields for users.
  Used with UserOrder to control result ordering.
  """
  enum UserOrderField {
    USERNAME
    EMAIL
    FIRSTNAME
    LASTNAME
    CREATEDAT
    MODIFIEDAT
    ID
  }

  """
  Sortable fields for countries.
  Used with CountryOrder to control result ordering.
  """
  enum CountryOrderField {
    NAME
    POPULATION
    AREA
    CREATEDAT
    MODIFIEDAT
    ID
  }

  """
  Sortable fields for animals.
  Used with AnimalOrder to control result ordering.
  """
  enum AnimalOrderField {
    NAME
    SPECIES
    CATEGORY
    CREATEDAT
    MODIFIEDAT
    ID
  }

  """
  Sortable fields for domains.
  Used with DomainOrder to control result ordering.
  """
  enum DomainOrderField {
    NAME
    CREATEDAT
    MODIFIEDAT
    ID
  }

  # =============================================================================
  # CORE ENTITY TYPES
  # =============================================================================

  """
  User information for authenticated actors of the system.
  """
  type User implements Node {
    id: ID!
    username: String!
    email: String!
    firstName: String
    lastName: String
    createdAt: DateTime!
    modifiedAt: DateTime!
    createdBy: User
    modifiedBy: User
  }

  """
  Country information including identifiers, demographics, and geography.
  """
  type Country implements Node {
    id: ID!
    name: String!
    capital: String
    population: Int
    area: Float
    currency: String
    continent: Continent!
    createdAt: DateTime!
    modifiedAt: DateTime!
    createdBy: User
    modifiedBy: User
  }

  """
  Animal information including biological, ecological, and conservation details.
  """
  type Animal implements Node {
    id: ID!
    name: String!
    species: String
    habitat: String
    diet: String
    conservation_status: String
    category: AnimalCategory!
    createdAt: DateTime!
    modifiedAt: DateTime!
    createdBy: User
    modifiedBy: User
  }

  """
  Domain information including hierarchy and audit fields.
  """
  type Domain implements Node {
    id: ID!
    name: String!
    parent: Domain
    createdAt: DateTime!
    modifiedAt: DateTime!
    createdBy: User
    modifiedBy: User
  }

  # =============================================================================
  # PAGINATION TYPES
  # =============================================================================

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
  Paginated list of users.
  """
  type UserPage implements Page {
    data: [User!]!
    pagination: Pagination!
  }

  """
  Paginated list of countries, including the data and pagination metadata.
  """
  type CountryPage implements Page {
    data: [Country!]!
    pagination: Pagination!
  }

  """
  Paginated list of animals, including the data and pagination metadata.
  """
  type AnimalPage implements Page {
    data: [Animal!]!
    pagination: Pagination!
  }

  """
  Paginated list of domains, including the data and pagination metadata.
  """
  type DomainPage implements Page {
    data: [Domain!]!
    pagination: Pagination!
  }

  # =============================================================================
  # INPUT TYPES
  # =============================================================================

  # Order Inputs
  """
  Defines ordering of country results.
  """
  input CountryOrder {
    field: CountryOrderField! = NAME
    direction: SortDirection! = ASC
  }

  """
  Defines ordering of animal results.
  """
  input AnimalOrder {
    field: AnimalOrderField! = NAME
    direction: SortDirection! = ASC
  }

  """
  Defines ordering of domain results.
  """
  input DomainOrder {
    field: DomainOrderField! = NAME
    direction: SortDirection! = ASC
  }

  input UserOrder {
    field: UserOrderField! = USERNAME
    direction: SortDirection! = ASC
  }

  # Filter Inputs
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
    # Audit field filters
    createdAt: DateTime
    modifiedAt: DateTime
    createdBy: ID
    modifiedBy: ID
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
    # Audit field filters
    createdAt: DateTime
    modifiedAt: DateTime
    createdBy: ID
    modifiedBy: ID
  }

  input UserFilter {
    username: String
    email: String
    firstName: String
    lastName: String
    # Audit field filters
    createdAt: DateTime
    modifiedAt: DateTime
    createdBy: ID
    modifiedBy: ID
  }

  input DomainFilter {
    name: String
    parentId: ID
    # Audit field filters
    createdAt: DateTime
    modifiedAt: DateTime
    createdBy: ID
    modifiedBy: ID
  }

  # Create/Update Inputs
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

  input CreateCountryInput {
    name: String!
    capital: String
    population: Int
    area: Float
    currency: String
    continent: Continent!
  }

  input UpdateCountryInput {
    id: ID!
    name: String
    capital: String
    population: Int
    area: Float
    currency: String
    continent: Continent
  }

  input CreateAnimalInput {
    name: String!
    species: String
    habitat: String
    diet: String
    conservation_status: String
    category: AnimalCategory!
  }

  input UpdateAnimalInput {
    id: ID!
    name: String
    species: String
    habitat: String
    diet: String
    conservation_status: String
    category: AnimalCategory
  }

  input CreateDomainInput {
    name: String!
    parentId: ID
  }

  input UpdateDomainInput {
    id: ID!
    name: String
    parentId: ID
  }

  # =============================================================================
  # QUERY TYPE
  # =============================================================================

  type Query {
    # User Queries
    """
    Returns a paginated list of users.
    """
    usersPaginated(
      search: String,
      filter: UserFilter,
      orderBy: UserOrder = { field: USERNAME, direction: ASC },
      args: PageArgs = { first: 20 }
    ): UserPage!

    """
    Returns a single user by its unique ID.
    """
    user(id: ID!): User

    # Country Queries
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
    Returns a non-paginated list of countries (deprecated).
    """
    countries(search: String, filter: CountryFilter): [Country!]! @deprecated(reason: "Use countriesPaginated instead")

    """
    Returns a single country by its unique ID.
    """
    country(id: ID!): Country

    # Animal Queries
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
    Returns a non-paginated list of animals (deprecated).
    """
    animals(search: String, filter: AnimalFilter): [Animal!]! @deprecated(reason: "Use animalsPaginated instead")

    """
    Returns a single animal by its unique ID.
    """
    animal(id: ID!): Animal

    # Domain Queries
    """
    Returns a paginated list of domains with optional search and ordering.
    """
    domainsPaginated(
      search: String,
      filter: DomainFilter,
      orderBy: DomainOrder = { field: NAME, direction: ASC },
      args: PageArgs = { first: 20 }
    ): DomainPage!

    """
    Returns a non-paginated list of domains (deprecated).
    """
    domains(search: String, filter: DomainFilter): [Domain!]! @deprecated(reason: "Use domainsPaginated instead")

    """
    Returns a single domain by its unique ID.
    """
    domain(id: ID!): Domain
  }

  # =============================================================================
  # MUTATION TYPE
  # =============================================================================

  type Mutation {
    # User Mutations
    """
    Creates a new user.
    """
  createUser(input: CreateUserInput!): User!
  updateUser(input: UpdateUserInput!): User
  deleteUser(id: ID!): User

    # Country Mutations
    """
    Creates a new country with the specified details.
    """
  createCountry(input: CreateCountryInput!): Country!
  updateCountry(input: UpdateCountryInput!): Country
  deleteCountry(id: ID!): Country

    # Animal Mutations
    """
    Creates a new animal with the specified details.
    """
  createAnimal(input: CreateAnimalInput!): Animal!
  updateAnimal(input: UpdateAnimalInput!): Animal
  deleteAnimal(id: ID!): Animal

    # Domain Mutations
    """
    Creates a new domain with the specified details.
    """
  createDomain(input: CreateDomainInput!): Domain!
  updateDomain(input: UpdateDomainInput!): Domain
  deleteDomain(id: ID!): Domain
  }
`;

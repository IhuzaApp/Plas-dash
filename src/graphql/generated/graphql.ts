// @ts-nocheck
// This file is auto-generated. Do not edit.

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};

function fetcher<TData, TVariables>(query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch("https://plas-starfish-46.hasura.app/v1/graphql", {
      method: "POST",
      ...{
        headers: {
          "x-hasura-admin-secret":
            "qKfoh139Xh2FmsgJUFrUzdhDWmrtGnKeoxlQm1loNyER6GqscTd8KRanIypyTsvJ",
        },
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  };
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  json: any;
  timestamptz: any;
  timetz: any;
  uuid: any;
};

/** Addresses */
export type Addresses = {
  __typename?: "Addresses";
  /** An array relationship */
  Orders: Array<Orders>;
  /** An aggregate relationship */
  Orders_aggregate: Orders_Aggregate;
  /** An object relationship */
  User: Users;
  city: Scalars["String"];
  created_at: Scalars["timestamptz"];
  id: Scalars["uuid"];
  is_default: Scalars["Boolean"];
  latitude: Scalars["String"];
  longitude: Scalars["String"];
  postal_code?: Maybe<Scalars["String"]>;
  street: Scalars["String"];
  updated_at: Scalars["String"];
  user_id: Scalars["uuid"];
};

/** Addresses */
export type AddressesOrdersArgs = {
  distinct_on?: InputMaybe<Array<Orders_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Orders_Order_By>>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

/** Addresses */
export type AddressesOrders_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Orders_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Orders_Order_By>>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

/** aggregated selection of "Addresses" */
export type Addresses_Aggregate = {
  __typename?: "Addresses_aggregate";
  aggregate?: Maybe<Addresses_Aggregate_Fields>;
  nodes: Array<Addresses>;
};

export type Addresses_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Addresses_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Addresses_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Addresses_Aggregate_Bool_Exp_Count>;
};

export type Addresses_Aggregate_Bool_Exp_Bool_And = {
  arguments: Addresses_Select_Column_Addresses_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Addresses_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Addresses_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Addresses_Select_Column_Addresses_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Addresses_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Addresses_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Addresses_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Addresses_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Addresses" */
export type Addresses_Aggregate_Fields = {
  __typename?: "Addresses_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Addresses_Max_Fields>;
  min?: Maybe<Addresses_Min_Fields>;
};

/** aggregate fields of "Addresses" */
export type Addresses_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Addresses_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Addresses" */
export type Addresses_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Addresses_Max_Order_By>;
  min?: InputMaybe<Addresses_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Addresses" */
export type Addresses_Arr_Rel_Insert_Input = {
  data: Array<Addresses_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Addresses_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Addresses". All fields are combined with a logical 'AND'. */
export type Addresses_Bool_Exp = {
  Orders?: InputMaybe<Orders_Bool_Exp>;
  Orders_aggregate?: InputMaybe<Orders_Aggregate_Bool_Exp>;
  User?: InputMaybe<Users_Bool_Exp>;
  _and?: InputMaybe<Array<Addresses_Bool_Exp>>;
  _not?: InputMaybe<Addresses_Bool_Exp>;
  _or?: InputMaybe<Array<Addresses_Bool_Exp>>;
  city?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  is_default?: InputMaybe<Boolean_Comparison_Exp>;
  latitude?: InputMaybe<String_Comparison_Exp>;
  longitude?: InputMaybe<String_Comparison_Exp>;
  postal_code?: InputMaybe<String_Comparison_Exp>;
  street?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<String_Comparison_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "Addresses" */
export enum Addresses_Constraint {
  /** unique or primary key constraint on columns "id" */
  AddressesPkey = "Addresses_pkey",
}

/** input type for inserting data into table "Addresses" */
export type Addresses_Insert_Input = {
  Orders?: InputMaybe<Orders_Arr_Rel_Insert_Input>;
  User?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  city?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_default?: InputMaybe<Scalars["Boolean"]>;
  latitude?: InputMaybe<Scalars["String"]>;
  longitude?: InputMaybe<Scalars["String"]>;
  postal_code?: InputMaybe<Scalars["String"]>;
  street?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type Addresses_Max_Fields = {
  __typename?: "Addresses_max_fields";
  city?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  latitude?: Maybe<Scalars["String"]>;
  longitude?: Maybe<Scalars["String"]>;
  postal_code?: Maybe<Scalars["String"]>;
  street?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["String"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "Addresses" */
export type Addresses_Max_Order_By = {
  city?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  latitude?: InputMaybe<Order_By>;
  longitude?: InputMaybe<Order_By>;
  postal_code?: InputMaybe<Order_By>;
  street?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Addresses_Min_Fields = {
  __typename?: "Addresses_min_fields";
  city?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  latitude?: Maybe<Scalars["String"]>;
  longitude?: Maybe<Scalars["String"]>;
  postal_code?: Maybe<Scalars["String"]>;
  street?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["String"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "Addresses" */
export type Addresses_Min_Order_By = {
  city?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  latitude?: InputMaybe<Order_By>;
  longitude?: InputMaybe<Order_By>;
  postal_code?: InputMaybe<Order_By>;
  street?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Addresses" */
export type Addresses_Mutation_Response = {
  __typename?: "Addresses_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Addresses>;
};

/** input type for inserting object relation for remote table "Addresses" */
export type Addresses_Obj_Rel_Insert_Input = {
  data: Addresses_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Addresses_On_Conflict>;
};

/** on_conflict condition type for table "Addresses" */
export type Addresses_On_Conflict = {
  constraint: Addresses_Constraint;
  update_columns?: Array<Addresses_Update_Column>;
  where?: InputMaybe<Addresses_Bool_Exp>;
};

/** Ordering options when selecting data from "Addresses". */
export type Addresses_Order_By = {
  Orders_aggregate?: InputMaybe<Orders_Aggregate_Order_By>;
  User?: InputMaybe<Users_Order_By>;
  city?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_default?: InputMaybe<Order_By>;
  latitude?: InputMaybe<Order_By>;
  longitude?: InputMaybe<Order_By>;
  postal_code?: InputMaybe<Order_By>;
  street?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Addresses */
export type Addresses_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Addresses" */
export enum Addresses_Select_Column {
  /** column name */
  City = "city",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  IsDefault = "is_default",
  /** column name */
  Latitude = "latitude",
  /** column name */
  Longitude = "longitude",
  /** column name */
  PostalCode = "postal_code",
  /** column name */
  Street = "street",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

/** select "Addresses_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Addresses" */
export enum Addresses_Select_Column_Addresses_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  IsDefault = "is_default",
}

/** select "Addresses_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Addresses" */
export enum Addresses_Select_Column_Addresses_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  IsDefault = "is_default",
}

/** input type for updating data in table "Addresses" */
export type Addresses_Set_Input = {
  city?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_default?: InputMaybe<Scalars["Boolean"]>;
  latitude?: InputMaybe<Scalars["String"]>;
  longitude?: InputMaybe<Scalars["String"]>;
  postal_code?: InputMaybe<Scalars["String"]>;
  street?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "Addresses" */
export type Addresses_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Addresses_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Addresses_Stream_Cursor_Value_Input = {
  city?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_default?: InputMaybe<Scalars["Boolean"]>;
  latitude?: InputMaybe<Scalars["String"]>;
  longitude?: InputMaybe<Scalars["String"]>;
  postal_code?: InputMaybe<Scalars["String"]>;
  street?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** update columns of table "Addresses" */
export enum Addresses_Update_Column {
  /** column name */
  City = "city",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  IsDefault = "is_default",
  /** column name */
  Latitude = "latitude",
  /** column name */
  Longitude = "longitude",
  /** column name */
  PostalCode = "postal_code",
  /** column name */
  Street = "street",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

export type Addresses_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Addresses_Set_Input>;
  /** filter the rows which have to be updated */
  where: Addresses_Bool_Exp;
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["Boolean"]>;
  _gt?: InputMaybe<Scalars["Boolean"]>;
  _gte?: InputMaybe<Scalars["Boolean"]>;
  _in?: InputMaybe<Array<Scalars["Boolean"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["Boolean"]>;
  _lte?: InputMaybe<Scalars["Boolean"]>;
  _neq?: InputMaybe<Scalars["Boolean"]>;
  _nin?: InputMaybe<Array<Scalars["Boolean"]>>;
};

/** Cart Items */
export type Cart_Items = {
  __typename?: "Cart_Items";
  /** An object relationship */
  Cart: Carts;
  /** An object relationship */
  Product: Products;
  cart_id: Scalars["uuid"];
  created_at: Scalars["timestamptz"];
  id: Scalars["uuid"];
  price: Scalars["String"];
  product_id: Scalars["uuid"];
  quantity: Scalars["Int"];
  updated_at: Scalars["String"];
};

/** aggregated selection of "Cart_Items" */
export type Cart_Items_Aggregate = {
  __typename?: "Cart_Items_aggregate";
  aggregate?: Maybe<Cart_Items_Aggregate_Fields>;
  nodes: Array<Cart_Items>;
};

export type Cart_Items_Aggregate_Bool_Exp = {
  count?: InputMaybe<Cart_Items_Aggregate_Bool_Exp_Count>;
};

export type Cart_Items_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Cart_Items_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Cart_Items_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Cart_Items" */
export type Cart_Items_Aggregate_Fields = {
  __typename?: "Cart_Items_aggregate_fields";
  avg?: Maybe<Cart_Items_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Cart_Items_Max_Fields>;
  min?: Maybe<Cart_Items_Min_Fields>;
  stddev?: Maybe<Cart_Items_Stddev_Fields>;
  stddev_pop?: Maybe<Cart_Items_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Cart_Items_Stddev_Samp_Fields>;
  sum?: Maybe<Cart_Items_Sum_Fields>;
  var_pop?: Maybe<Cart_Items_Var_Pop_Fields>;
  var_samp?: Maybe<Cart_Items_Var_Samp_Fields>;
  variance?: Maybe<Cart_Items_Variance_Fields>;
};

/** aggregate fields of "Cart_Items" */
export type Cart_Items_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Cart_Items_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Cart_Items" */
export type Cart_Items_Aggregate_Order_By = {
  avg?: InputMaybe<Cart_Items_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Cart_Items_Max_Order_By>;
  min?: InputMaybe<Cart_Items_Min_Order_By>;
  stddev?: InputMaybe<Cart_Items_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Cart_Items_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Cart_Items_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Cart_Items_Sum_Order_By>;
  var_pop?: InputMaybe<Cart_Items_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Cart_Items_Var_Samp_Order_By>;
  variance?: InputMaybe<Cart_Items_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Cart_Items" */
export type Cart_Items_Arr_Rel_Insert_Input = {
  data: Array<Cart_Items_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Cart_Items_On_Conflict>;
};

/** aggregate avg on columns */
export type Cart_Items_Avg_Fields = {
  __typename?: "Cart_Items_avg_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "Cart_Items" */
export type Cart_Items_Avg_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Cart_Items". All fields are combined with a logical 'AND'. */
export type Cart_Items_Bool_Exp = {
  Cart?: InputMaybe<Carts_Bool_Exp>;
  Product?: InputMaybe<Products_Bool_Exp>;
  _and?: InputMaybe<Array<Cart_Items_Bool_Exp>>;
  _not?: InputMaybe<Cart_Items_Bool_Exp>;
  _or?: InputMaybe<Array<Cart_Items_Bool_Exp>>;
  cart_id?: InputMaybe<Uuid_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  price?: InputMaybe<String_Comparison_Exp>;
  product_id?: InputMaybe<Uuid_Comparison_Exp>;
  quantity?: InputMaybe<Int_Comparison_Exp>;
  updated_at?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "Cart_Items" */
export enum Cart_Items_Constraint {
  /** unique or primary key constraint on columns "id" */
  CartItemsPkey = "Cart_Items_pkey",
}

/** input type for incrementing numeric columns in table "Cart_Items" */
export type Cart_Items_Inc_Input = {
  quantity?: InputMaybe<Scalars["Int"]>;
};

/** input type for inserting data into table "Cart_Items" */
export type Cart_Items_Insert_Input = {
  Cart?: InputMaybe<Carts_Obj_Rel_Insert_Input>;
  Product?: InputMaybe<Products_Obj_Rel_Insert_Input>;
  cart_id?: InputMaybe<Scalars["uuid"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  price?: InputMaybe<Scalars["String"]>;
  product_id?: InputMaybe<Scalars["uuid"]>;
  quantity?: InputMaybe<Scalars["Int"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Cart_Items_Max_Fields = {
  __typename?: "Cart_Items_max_fields";
  cart_id?: Maybe<Scalars["uuid"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  price?: Maybe<Scalars["String"]>;
  product_id?: Maybe<Scalars["uuid"]>;
  quantity?: Maybe<Scalars["Int"]>;
  updated_at?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "Cart_Items" */
export type Cart_Items_Max_Order_By = {
  cart_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  product_id?: InputMaybe<Order_By>;
  quantity?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Cart_Items_Min_Fields = {
  __typename?: "Cart_Items_min_fields";
  cart_id?: Maybe<Scalars["uuid"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  price?: Maybe<Scalars["String"]>;
  product_id?: Maybe<Scalars["uuid"]>;
  quantity?: Maybe<Scalars["Int"]>;
  updated_at?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "Cart_Items" */
export type Cart_Items_Min_Order_By = {
  cart_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  product_id?: InputMaybe<Order_By>;
  quantity?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Cart_Items" */
export type Cart_Items_Mutation_Response = {
  __typename?: "Cart_Items_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Cart_Items>;
};

/** on_conflict condition type for table "Cart_Items" */
export type Cart_Items_On_Conflict = {
  constraint: Cart_Items_Constraint;
  update_columns?: Array<Cart_Items_Update_Column>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

/** Ordering options when selecting data from "Cart_Items". */
export type Cart_Items_Order_By = {
  Cart?: InputMaybe<Carts_Order_By>;
  Product?: InputMaybe<Products_Order_By>;
  cart_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  product_id?: InputMaybe<Order_By>;
  quantity?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Cart_Items */
export type Cart_Items_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Cart_Items" */
export enum Cart_Items_Select_Column {
  /** column name */
  CartId = "cart_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Price = "price",
  /** column name */
  ProductId = "product_id",
  /** column name */
  Quantity = "quantity",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "Cart_Items" */
export type Cart_Items_Set_Input = {
  cart_id?: InputMaybe<Scalars["uuid"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  price?: InputMaybe<Scalars["String"]>;
  product_id?: InputMaybe<Scalars["uuid"]>;
  quantity?: InputMaybe<Scalars["Int"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** aggregate stddev on columns */
export type Cart_Items_Stddev_Fields = {
  __typename?: "Cart_Items_stddev_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "Cart_Items" */
export type Cart_Items_Stddev_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Cart_Items_Stddev_Pop_Fields = {
  __typename?: "Cart_Items_stddev_pop_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "Cart_Items" */
export type Cart_Items_Stddev_Pop_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Cart_Items_Stddev_Samp_Fields = {
  __typename?: "Cart_Items_stddev_samp_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "Cart_Items" */
export type Cart_Items_Stddev_Samp_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "Cart_Items" */
export type Cart_Items_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Cart_Items_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Cart_Items_Stream_Cursor_Value_Input = {
  cart_id?: InputMaybe<Scalars["uuid"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  price?: InputMaybe<Scalars["String"]>;
  product_id?: InputMaybe<Scalars["uuid"]>;
  quantity?: InputMaybe<Scalars["Int"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** aggregate sum on columns */
export type Cart_Items_Sum_Fields = {
  __typename?: "Cart_Items_sum_fields";
  quantity?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "Cart_Items" */
export type Cart_Items_Sum_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** update columns of table "Cart_Items" */
export enum Cart_Items_Update_Column {
  /** column name */
  CartId = "cart_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Price = "price",
  /** column name */
  ProductId = "product_id",
  /** column name */
  Quantity = "quantity",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Cart_Items_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Cart_Items_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Cart_Items_Set_Input>;
  /** filter the rows which have to be updated */
  where: Cart_Items_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Cart_Items_Var_Pop_Fields = {
  __typename?: "Cart_Items_var_pop_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "Cart_Items" */
export type Cart_Items_Var_Pop_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Cart_Items_Var_Samp_Fields = {
  __typename?: "Cart_Items_var_samp_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "Cart_Items" */
export type Cart_Items_Var_Samp_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Cart_Items_Variance_Fields = {
  __typename?: "Cart_Items_variance_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "Cart_Items" */
export type Cart_Items_Variance_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** Carts */
export type Carts = {
  __typename?: "Carts";
  /** An array relationship */
  Cart_Items: Array<Cart_Items>;
  /** An aggregate relationship */
  Cart_Items_aggregate: Cart_Items_Aggregate;
  /** An object relationship */
  User: Users;
  created_at: Scalars["timestamptz"];
  id: Scalars["uuid"];
  total: Scalars["String"];
  updated_at: Scalars["String"];
  user_id: Scalars["uuid"];
};

/** Carts */
export type CartsCart_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Cart_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cart_Items_Order_By>>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

/** Carts */
export type CartsCart_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Cart_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cart_Items_Order_By>>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

/** aggregated selection of "Carts" */
export type Carts_Aggregate = {
  __typename?: "Carts_aggregate";
  aggregate?: Maybe<Carts_Aggregate_Fields>;
  nodes: Array<Carts>;
};

export type Carts_Aggregate_Bool_Exp = {
  count?: InputMaybe<Carts_Aggregate_Bool_Exp_Count>;
};

export type Carts_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Carts_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Carts_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Carts" */
export type Carts_Aggregate_Fields = {
  __typename?: "Carts_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Carts_Max_Fields>;
  min?: Maybe<Carts_Min_Fields>;
};

/** aggregate fields of "Carts" */
export type Carts_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Carts_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Carts" */
export type Carts_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Carts_Max_Order_By>;
  min?: InputMaybe<Carts_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Carts" */
export type Carts_Arr_Rel_Insert_Input = {
  data: Array<Carts_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Carts_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Carts". All fields are combined with a logical 'AND'. */
export type Carts_Bool_Exp = {
  Cart_Items?: InputMaybe<Cart_Items_Bool_Exp>;
  Cart_Items_aggregate?: InputMaybe<Cart_Items_Aggregate_Bool_Exp>;
  User?: InputMaybe<Users_Bool_Exp>;
  _and?: InputMaybe<Array<Carts_Bool_Exp>>;
  _not?: InputMaybe<Carts_Bool_Exp>;
  _or?: InputMaybe<Array<Carts_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  total?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<String_Comparison_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "Carts" */
export enum Carts_Constraint {
  /** unique or primary key constraint on columns "id" */
  CartsPkey = "Carts_pkey",
}

/** input type for inserting data into table "Carts" */
export type Carts_Insert_Input = {
  Cart_Items?: InputMaybe<Cart_Items_Arr_Rel_Insert_Input>;
  User?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  total?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type Carts_Max_Fields = {
  __typename?: "Carts_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  total?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["String"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "Carts" */
export type Carts_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  total?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Carts_Min_Fields = {
  __typename?: "Carts_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  total?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["String"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "Carts" */
export type Carts_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  total?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Carts" */
export type Carts_Mutation_Response = {
  __typename?: "Carts_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Carts>;
};

/** input type for inserting object relation for remote table "Carts" */
export type Carts_Obj_Rel_Insert_Input = {
  data: Carts_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Carts_On_Conflict>;
};

/** on_conflict condition type for table "Carts" */
export type Carts_On_Conflict = {
  constraint: Carts_Constraint;
  update_columns?: Array<Carts_Update_Column>;
  where?: InputMaybe<Carts_Bool_Exp>;
};

/** Ordering options when selecting data from "Carts". */
export type Carts_Order_By = {
  Cart_Items_aggregate?: InputMaybe<Cart_Items_Aggregate_Order_By>;
  User?: InputMaybe<Users_Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  total?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Carts */
export type Carts_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Carts" */
export enum Carts_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Total = "total",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "Carts" */
export type Carts_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  total?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "Carts" */
export type Carts_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Carts_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Carts_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  total?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** update columns of table "Carts" */
export enum Carts_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Total = "total",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

export type Carts_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Carts_Set_Input>;
  /** filter the rows which have to be updated */
  where: Carts_Bool_Exp;
};

/** columns and relationships of "Categories" */
export type Categories = {
  __typename?: "Categories";
  /** An array relationship */
  Shops: Array<Shops>;
  /** An aggregate relationship */
  Shops_aggregate: Shops_Aggregate;
  created_at: Scalars["timestamptz"];
  description: Scalars["String"];
  id: Scalars["uuid"];
  image: Scalars["String"];
  is_active: Scalars["Boolean"];
  name: Scalars["String"];
};

/** columns and relationships of "Categories" */
export type CategoriesShopsArgs = {
  distinct_on?: InputMaybe<Array<Shops_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shops_Order_By>>;
  where?: InputMaybe<Shops_Bool_Exp>;
};

/** columns and relationships of "Categories" */
export type CategoriesShops_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Shops_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shops_Order_By>>;
  where?: InputMaybe<Shops_Bool_Exp>;
};

/** aggregated selection of "Categories" */
export type Categories_Aggregate = {
  __typename?: "Categories_aggregate";
  aggregate?: Maybe<Categories_Aggregate_Fields>;
  nodes: Array<Categories>;
};

/** aggregate fields of "Categories" */
export type Categories_Aggregate_Fields = {
  __typename?: "Categories_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Categories_Max_Fields>;
  min?: Maybe<Categories_Min_Fields>;
};

/** aggregate fields of "Categories" */
export type Categories_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Categories_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "Categories". All fields are combined with a logical 'AND'. */
export type Categories_Bool_Exp = {
  Shops?: InputMaybe<Shops_Bool_Exp>;
  Shops_aggregate?: InputMaybe<Shops_Aggregate_Bool_Exp>;
  _and?: InputMaybe<Array<Categories_Bool_Exp>>;
  _not?: InputMaybe<Categories_Bool_Exp>;
  _or?: InputMaybe<Array<Categories_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  is_active?: InputMaybe<Boolean_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "Categories" */
export enum Categories_Constraint {
  /** unique or primary key constraint on columns "id" */
  CategoriesPkey = "Categories_pkey",
}

/** input type for inserting data into table "Categories" */
export type Categories_Insert_Input = {
  Shops?: InputMaybe<Shops_Arr_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  image?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Categories_Max_Fields = {
  __typename?: "Categories_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  image?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type Categories_Min_Fields = {
  __typename?: "Categories_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  image?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "Categories" */
export type Categories_Mutation_Response = {
  __typename?: "Categories_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Categories>;
};

/** input type for inserting object relation for remote table "Categories" */
export type Categories_Obj_Rel_Insert_Input = {
  data: Categories_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Categories_On_Conflict>;
};

/** on_conflict condition type for table "Categories" */
export type Categories_On_Conflict = {
  constraint: Categories_Constraint;
  update_columns?: Array<Categories_Update_Column>;
  where?: InputMaybe<Categories_Bool_Exp>;
};

/** Ordering options when selecting data from "Categories". */
export type Categories_Order_By = {
  Shops_aggregate?: InputMaybe<Shops_Aggregate_Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  is_active?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Categories */
export type Categories_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Categories" */
export enum Categories_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  Id = "id",
  /** column name */
  Image = "image",
  /** column name */
  IsActive = "is_active",
  /** column name */
  Name = "name",
}

/** input type for updating data in table "Categories" */
export type Categories_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  image?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "Categories" */
export type Categories_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Categories_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Categories_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  image?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "Categories" */
export enum Categories_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  Id = "id",
  /** column name */
  Image = "image",
  /** column name */
  IsActive = "is_active",
  /** column name */
  Name = "name",
}

export type Categories_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Categories_Set_Input>;
  /** filter the rows which have to be updated */
  where: Categories_Bool_Exp;
};

/** Delivery Issues */
export type Delivery_Issues = {
  __typename?: "Delivery_Issues";
  /** An object relationship */
  Order: Orders;
  /** An object relationship */
  User: Users;
  created_at: Scalars["timestamptz"];
  description: Scalars["String"];
  id: Scalars["uuid"];
  issue_type: Scalars["String"];
  order_id: Scalars["uuid"];
  shopper_id: Scalars["uuid"];
  status: Scalars["String"];
  updated_at: Scalars["timestamptz"];
};

/** aggregated selection of "Delivery_Issues" */
export type Delivery_Issues_Aggregate = {
  __typename?: "Delivery_Issues_aggregate";
  aggregate?: Maybe<Delivery_Issues_Aggregate_Fields>;
  nodes: Array<Delivery_Issues>;
};

export type Delivery_Issues_Aggregate_Bool_Exp = {
  count?: InputMaybe<Delivery_Issues_Aggregate_Bool_Exp_Count>;
};

export type Delivery_Issues_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Delivery_Issues_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Delivery_Issues" */
export type Delivery_Issues_Aggregate_Fields = {
  __typename?: "Delivery_Issues_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Delivery_Issues_Max_Fields>;
  min?: Maybe<Delivery_Issues_Min_Fields>;
};

/** aggregate fields of "Delivery_Issues" */
export type Delivery_Issues_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Delivery_Issues" */
export type Delivery_Issues_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Delivery_Issues_Max_Order_By>;
  min?: InputMaybe<Delivery_Issues_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Delivery_Issues" */
export type Delivery_Issues_Arr_Rel_Insert_Input = {
  data: Array<Delivery_Issues_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Delivery_Issues_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Delivery_Issues". All fields are combined with a logical 'AND'. */
export type Delivery_Issues_Bool_Exp = {
  Order?: InputMaybe<Orders_Bool_Exp>;
  User?: InputMaybe<Users_Bool_Exp>;
  _and?: InputMaybe<Array<Delivery_Issues_Bool_Exp>>;
  _not?: InputMaybe<Delivery_Issues_Bool_Exp>;
  _or?: InputMaybe<Array<Delivery_Issues_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  issue_type?: InputMaybe<String_Comparison_Exp>;
  order_id?: InputMaybe<Uuid_Comparison_Exp>;
  shopper_id?: InputMaybe<Uuid_Comparison_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "Delivery_Issues" */
export enum Delivery_Issues_Constraint {
  /** unique or primary key constraint on columns "id" */
  DeliveryIssuesPkey = "Delivery_Issues_pkey",
}

/** input type for inserting data into table "Delivery_Issues" */
export type Delivery_Issues_Insert_Input = {
  Order?: InputMaybe<Orders_Obj_Rel_Insert_Input>;
  User?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  issue_type?: InputMaybe<Scalars["String"]>;
  order_id?: InputMaybe<Scalars["uuid"]>;
  shopper_id?: InputMaybe<Scalars["uuid"]>;
  status?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** aggregate max on columns */
export type Delivery_Issues_Max_Fields = {
  __typename?: "Delivery_Issues_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  issue_type?: Maybe<Scalars["String"]>;
  order_id?: Maybe<Scalars["uuid"]>;
  shopper_id?: Maybe<Scalars["uuid"]>;
  status?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by max() on columns of table "Delivery_Issues" */
export type Delivery_Issues_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  issue_type?: InputMaybe<Order_By>;
  order_id?: InputMaybe<Order_By>;
  shopper_id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Delivery_Issues_Min_Fields = {
  __typename?: "Delivery_Issues_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  issue_type?: Maybe<Scalars["String"]>;
  order_id?: Maybe<Scalars["uuid"]>;
  shopper_id?: Maybe<Scalars["uuid"]>;
  status?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** order by min() on columns of table "Delivery_Issues" */
export type Delivery_Issues_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  issue_type?: InputMaybe<Order_By>;
  order_id?: InputMaybe<Order_By>;
  shopper_id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Delivery_Issues" */
export type Delivery_Issues_Mutation_Response = {
  __typename?: "Delivery_Issues_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Delivery_Issues>;
};

/** on_conflict condition type for table "Delivery_Issues" */
export type Delivery_Issues_On_Conflict = {
  constraint: Delivery_Issues_Constraint;
  update_columns?: Array<Delivery_Issues_Update_Column>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

/** Ordering options when selecting data from "Delivery_Issues". */
export type Delivery_Issues_Order_By = {
  Order?: InputMaybe<Orders_Order_By>;
  User?: InputMaybe<Users_Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  issue_type?: InputMaybe<Order_By>;
  order_id?: InputMaybe<Order_By>;
  shopper_id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Delivery_Issues */
export type Delivery_Issues_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Delivery_Issues" */
export enum Delivery_Issues_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  Id = "id",
  /** column name */
  IssueType = "issue_type",
  /** column name */
  OrderId = "order_id",
  /** column name */
  ShopperId = "shopper_id",
  /** column name */
  Status = "status",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "Delivery_Issues" */
export type Delivery_Issues_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  issue_type?: InputMaybe<Scalars["String"]>;
  order_id?: InputMaybe<Scalars["uuid"]>;
  shopper_id?: InputMaybe<Scalars["uuid"]>;
  status?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** Streaming cursor of the table "Delivery_Issues" */
export type Delivery_Issues_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Delivery_Issues_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Delivery_Issues_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  issue_type?: InputMaybe<Scalars["String"]>;
  order_id?: InputMaybe<Scalars["uuid"]>;
  shopper_id?: InputMaybe<Scalars["uuid"]>;
  status?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
};

/** update columns of table "Delivery_Issues" */
export enum Delivery_Issues_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  Id = "id",
  /** column name */
  IssueType = "issue_type",
  /** column name */
  OrderId = "order_id",
  /** column name */
  ShopperId = "shopper_id",
  /** column name */
  Status = "status",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Delivery_Issues_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Delivery_Issues_Set_Input>;
  /** filter the rows which have to be updated */
  where: Delivery_Issues_Bool_Exp;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["Int"]>;
  _gt?: InputMaybe<Scalars["Int"]>;
  _gte?: InputMaybe<Scalars["Int"]>;
  _in?: InputMaybe<Array<Scalars["Int"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["Int"]>;
  _lte?: InputMaybe<Scalars["Int"]>;
  _neq?: InputMaybe<Scalars["Int"]>;
  _nin?: InputMaybe<Array<Scalars["Int"]>>;
};

/** Notifications */
export type Notifications = {
  __typename?: "Notifications";
  /** An object relationship */
  User: Users;
  created_at: Scalars["timestamptz"];
  id: Scalars["uuid"];
  is_read: Scalars["Boolean"];
  message: Scalars["String"];
  type: Scalars["String"];
  user_id: Scalars["uuid"];
};

/** aggregated selection of "Notifications" */
export type Notifications_Aggregate = {
  __typename?: "Notifications_aggregate";
  aggregate?: Maybe<Notifications_Aggregate_Fields>;
  nodes: Array<Notifications>;
};

export type Notifications_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Notifications_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Notifications_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Notifications_Aggregate_Bool_Exp_Count>;
};

export type Notifications_Aggregate_Bool_Exp_Bool_And = {
  arguments: Notifications_Select_Column_Notifications_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Notifications_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Notifications_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Notifications_Select_Column_Notifications_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Notifications_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Notifications_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Notifications_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Notifications_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Notifications" */
export type Notifications_Aggregate_Fields = {
  __typename?: "Notifications_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Notifications_Max_Fields>;
  min?: Maybe<Notifications_Min_Fields>;
};

/** aggregate fields of "Notifications" */
export type Notifications_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Notifications_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Notifications" */
export type Notifications_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Notifications_Max_Order_By>;
  min?: InputMaybe<Notifications_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Notifications" */
export type Notifications_Arr_Rel_Insert_Input = {
  data: Array<Notifications_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Notifications_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Notifications". All fields are combined with a logical 'AND'. */
export type Notifications_Bool_Exp = {
  User?: InputMaybe<Users_Bool_Exp>;
  _and?: InputMaybe<Array<Notifications_Bool_Exp>>;
  _not?: InputMaybe<Notifications_Bool_Exp>;
  _or?: InputMaybe<Array<Notifications_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  is_read?: InputMaybe<Boolean_Comparison_Exp>;
  message?: InputMaybe<String_Comparison_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "Notifications" */
export enum Notifications_Constraint {
  /** unique or primary key constraint on columns "id" */
  NotificationsPkey = "Notifications_pkey",
}

/** input type for inserting data into table "Notifications" */
export type Notifications_Insert_Input = {
  User?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_read?: InputMaybe<Scalars["Boolean"]>;
  message?: InputMaybe<Scalars["String"]>;
  type?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type Notifications_Max_Fields = {
  __typename?: "Notifications_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  message?: Maybe<Scalars["String"]>;
  type?: Maybe<Scalars["String"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "Notifications" */
export type Notifications_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  message?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Notifications_Min_Fields = {
  __typename?: "Notifications_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  message?: Maybe<Scalars["String"]>;
  type?: Maybe<Scalars["String"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "Notifications" */
export type Notifications_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  message?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Notifications" */
export type Notifications_Mutation_Response = {
  __typename?: "Notifications_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Notifications>;
};

/** on_conflict condition type for table "Notifications" */
export type Notifications_On_Conflict = {
  constraint: Notifications_Constraint;
  update_columns?: Array<Notifications_Update_Column>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

/** Ordering options when selecting data from "Notifications". */
export type Notifications_Order_By = {
  User?: InputMaybe<Users_Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_read?: InputMaybe<Order_By>;
  message?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Notifications */
export type Notifications_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Notifications" */
export enum Notifications_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  IsRead = "is_read",
  /** column name */
  Message = "message",
  /** column name */
  Type = "type",
  /** column name */
  UserId = "user_id",
}

/** select "Notifications_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Notifications" */
export enum Notifications_Select_Column_Notifications_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  IsRead = "is_read",
}

/** select "Notifications_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Notifications" */
export enum Notifications_Select_Column_Notifications_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  IsRead = "is_read",
}

/** input type for updating data in table "Notifications" */
export type Notifications_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_read?: InputMaybe<Scalars["Boolean"]>;
  message?: InputMaybe<Scalars["String"]>;
  type?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "Notifications" */
export type Notifications_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Notifications_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Notifications_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_read?: InputMaybe<Scalars["Boolean"]>;
  message?: InputMaybe<Scalars["String"]>;
  type?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** update columns of table "Notifications" */
export enum Notifications_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  IsRead = "is_read",
  /** column name */
  Message = "message",
  /** column name */
  Type = "type",
  /** column name */
  UserId = "user_id",
}

export type Notifications_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Notifications_Set_Input>;
  /** filter the rows which have to be updated */
  where: Notifications_Bool_Exp;
};

/** Order Items */
export type Order_Items = {
  __typename?: "Order_Items";
  /** An object relationship */
  Order: Orders;
  /** An object relationship */
  Product: Products;
  created_at: Scalars["timestamptz"];
  id: Scalars["uuid"];
  order_id: Scalars["uuid"];
  price: Scalars["String"];
  product_id: Scalars["uuid"];
  quantity: Scalars["Int"];
};

/** aggregated selection of "Order_Items" */
export type Order_Items_Aggregate = {
  __typename?: "Order_Items_aggregate";
  aggregate?: Maybe<Order_Items_Aggregate_Fields>;
  nodes: Array<Order_Items>;
};

export type Order_Items_Aggregate_Bool_Exp = {
  count?: InputMaybe<Order_Items_Aggregate_Bool_Exp_Count>;
};

export type Order_Items_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Order_Items_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Order_Items_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Order_Items" */
export type Order_Items_Aggregate_Fields = {
  __typename?: "Order_Items_aggregate_fields";
  avg?: Maybe<Order_Items_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Order_Items_Max_Fields>;
  min?: Maybe<Order_Items_Min_Fields>;
  stddev?: Maybe<Order_Items_Stddev_Fields>;
  stddev_pop?: Maybe<Order_Items_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Order_Items_Stddev_Samp_Fields>;
  sum?: Maybe<Order_Items_Sum_Fields>;
  var_pop?: Maybe<Order_Items_Var_Pop_Fields>;
  var_samp?: Maybe<Order_Items_Var_Samp_Fields>;
  variance?: Maybe<Order_Items_Variance_Fields>;
};

/** aggregate fields of "Order_Items" */
export type Order_Items_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Order_Items_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Order_Items" */
export type Order_Items_Aggregate_Order_By = {
  avg?: InputMaybe<Order_Items_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Order_Items_Max_Order_By>;
  min?: InputMaybe<Order_Items_Min_Order_By>;
  stddev?: InputMaybe<Order_Items_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Order_Items_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Order_Items_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Order_Items_Sum_Order_By>;
  var_pop?: InputMaybe<Order_Items_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Order_Items_Var_Samp_Order_By>;
  variance?: InputMaybe<Order_Items_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Order_Items" */
export type Order_Items_Arr_Rel_Insert_Input = {
  data: Array<Order_Items_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Order_Items_On_Conflict>;
};

/** aggregate avg on columns */
export type Order_Items_Avg_Fields = {
  __typename?: "Order_Items_avg_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "Order_Items" */
export type Order_Items_Avg_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Order_Items". All fields are combined with a logical 'AND'. */
export type Order_Items_Bool_Exp = {
  Order?: InputMaybe<Orders_Bool_Exp>;
  Product?: InputMaybe<Products_Bool_Exp>;
  _and?: InputMaybe<Array<Order_Items_Bool_Exp>>;
  _not?: InputMaybe<Order_Items_Bool_Exp>;
  _or?: InputMaybe<Array<Order_Items_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  order_id?: InputMaybe<Uuid_Comparison_Exp>;
  price?: InputMaybe<String_Comparison_Exp>;
  product_id?: InputMaybe<Uuid_Comparison_Exp>;
  quantity?: InputMaybe<Int_Comparison_Exp>;
};

/** unique or primary key constraints on table "Order_Items" */
export enum Order_Items_Constraint {
  /** unique or primary key constraint on columns "id" */
  OrderItemsPkey = "Order_Items_pkey",
}

/** input type for incrementing numeric columns in table "Order_Items" */
export type Order_Items_Inc_Input = {
  quantity?: InputMaybe<Scalars["Int"]>;
};

/** input type for inserting data into table "Order_Items" */
export type Order_Items_Insert_Input = {
  Order?: InputMaybe<Orders_Obj_Rel_Insert_Input>;
  Product?: InputMaybe<Products_Obj_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  order_id?: InputMaybe<Scalars["uuid"]>;
  price?: InputMaybe<Scalars["String"]>;
  product_id?: InputMaybe<Scalars["uuid"]>;
  quantity?: InputMaybe<Scalars["Int"]>;
};

/** aggregate max on columns */
export type Order_Items_Max_Fields = {
  __typename?: "Order_Items_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  order_id?: Maybe<Scalars["uuid"]>;
  price?: Maybe<Scalars["String"]>;
  product_id?: Maybe<Scalars["uuid"]>;
  quantity?: Maybe<Scalars["Int"]>;
};

/** order by max() on columns of table "Order_Items" */
export type Order_Items_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  order_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  product_id?: InputMaybe<Order_By>;
  quantity?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Order_Items_Min_Fields = {
  __typename?: "Order_Items_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  order_id?: Maybe<Scalars["uuid"]>;
  price?: Maybe<Scalars["String"]>;
  product_id?: Maybe<Scalars["uuid"]>;
  quantity?: Maybe<Scalars["Int"]>;
};

/** order by min() on columns of table "Order_Items" */
export type Order_Items_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  order_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  product_id?: InputMaybe<Order_By>;
  quantity?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Order_Items" */
export type Order_Items_Mutation_Response = {
  __typename?: "Order_Items_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Order_Items>;
};

/** on_conflict condition type for table "Order_Items" */
export type Order_Items_On_Conflict = {
  constraint: Order_Items_Constraint;
  update_columns?: Array<Order_Items_Update_Column>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

/** Ordering options when selecting data from "Order_Items". */
export type Order_Items_Order_By = {
  Order?: InputMaybe<Orders_Order_By>;
  Product?: InputMaybe<Products_Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  order_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  product_id?: InputMaybe<Order_By>;
  quantity?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Order_Items */
export type Order_Items_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Order_Items" */
export enum Order_Items_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  OrderId = "order_id",
  /** column name */
  Price = "price",
  /** column name */
  ProductId = "product_id",
  /** column name */
  Quantity = "quantity",
}

/** input type for updating data in table "Order_Items" */
export type Order_Items_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  order_id?: InputMaybe<Scalars["uuid"]>;
  price?: InputMaybe<Scalars["String"]>;
  product_id?: InputMaybe<Scalars["uuid"]>;
  quantity?: InputMaybe<Scalars["Int"]>;
};

/** aggregate stddev on columns */
export type Order_Items_Stddev_Fields = {
  __typename?: "Order_Items_stddev_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "Order_Items" */
export type Order_Items_Stddev_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Order_Items_Stddev_Pop_Fields = {
  __typename?: "Order_Items_stddev_pop_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "Order_Items" */
export type Order_Items_Stddev_Pop_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Order_Items_Stddev_Samp_Fields = {
  __typename?: "Order_Items_stddev_samp_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "Order_Items" */
export type Order_Items_Stddev_Samp_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "Order_Items" */
export type Order_Items_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Order_Items_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Order_Items_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  order_id?: InputMaybe<Scalars["uuid"]>;
  price?: InputMaybe<Scalars["String"]>;
  product_id?: InputMaybe<Scalars["uuid"]>;
  quantity?: InputMaybe<Scalars["Int"]>;
};

/** aggregate sum on columns */
export type Order_Items_Sum_Fields = {
  __typename?: "Order_Items_sum_fields";
  quantity?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "Order_Items" */
export type Order_Items_Sum_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** update columns of table "Order_Items" */
export enum Order_Items_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  OrderId = "order_id",
  /** column name */
  Price = "price",
  /** column name */
  ProductId = "product_id",
  /** column name */
  Quantity = "quantity",
}

export type Order_Items_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Order_Items_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Order_Items_Set_Input>;
  /** filter the rows which have to be updated */
  where: Order_Items_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Order_Items_Var_Pop_Fields = {
  __typename?: "Order_Items_var_pop_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "Order_Items" */
export type Order_Items_Var_Pop_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Order_Items_Var_Samp_Fields = {
  __typename?: "Order_Items_var_samp_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "Order_Items" */
export type Order_Items_Var_Samp_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Order_Items_Variance_Fields = {
  __typename?: "Order_Items_variance_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "Order_Items" */
export type Order_Items_Variance_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** columns and relationships of "Orders" */
export type Orders = {
  __typename?: "Orders";
  /** An object relationship */
  Address: Addresses;
  /** An array relationship */
  Delivery_Issues: Array<Delivery_Issues>;
  /** An aggregate relationship */
  Delivery_Issues_aggregate: Delivery_Issues_Aggregate;
  /** An array relationship */
  Order_Items: Array<Order_Items>;
  /** An aggregate relationship */
  Order_Items_aggregate: Order_Items_Aggregate;
  /** An object relationship */
  User: Users;
  combined_order_id?: Maybe<Scalars["uuid"]>;
  created_at: Scalars["timestamptz"];
  delivery_address_id: Scalars["uuid"];
  delivery_notes: Scalars["String"];
  delivery_photo_url: Scalars["String"];
  delivery_time?: Maybe<Scalars["timestamptz"]>;
  id: Scalars["uuid"];
  shopper_id: Scalars["uuid"];
  status: Scalars["String"];
  total: Scalars["String"];
  updated_at: Scalars["timestamptz"];
  /** An object relationship */
  userByUserId: Users;
  user_id: Scalars["uuid"];
};

/** columns and relationships of "Orders" */
export type OrdersDelivery_IssuesArgs = {
  distinct_on?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Delivery_Issues_Order_By>>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

/** columns and relationships of "Orders" */
export type OrdersDelivery_Issues_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Delivery_Issues_Order_By>>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

/** columns and relationships of "Orders" */
export type OrdersOrder_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Order_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Order_Items_Order_By>>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

/** columns and relationships of "Orders" */
export type OrdersOrder_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Order_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Order_Items_Order_By>>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

/** aggregated selection of "Orders" */
export type Orders_Aggregate = {
  __typename?: "Orders_aggregate";
  aggregate?: Maybe<Orders_Aggregate_Fields>;
  nodes: Array<Orders>;
};

export type Orders_Aggregate_Bool_Exp = {
  count?: InputMaybe<Orders_Aggregate_Bool_Exp_Count>;
};

export type Orders_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Orders_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Orders_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Orders" */
export type Orders_Aggregate_Fields = {
  __typename?: "Orders_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Orders_Max_Fields>;
  min?: Maybe<Orders_Min_Fields>;
};

/** aggregate fields of "Orders" */
export type Orders_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Orders_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Orders" */
export type Orders_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Orders_Max_Order_By>;
  min?: InputMaybe<Orders_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Orders" */
export type Orders_Arr_Rel_Insert_Input = {
  data: Array<Orders_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Orders_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Orders". All fields are combined with a logical 'AND'. */
export type Orders_Bool_Exp = {
  Address?: InputMaybe<Addresses_Bool_Exp>;
  Delivery_Issues?: InputMaybe<Delivery_Issues_Bool_Exp>;
  Delivery_Issues_aggregate?: InputMaybe<Delivery_Issues_Aggregate_Bool_Exp>;
  Order_Items?: InputMaybe<Order_Items_Bool_Exp>;
  Order_Items_aggregate?: InputMaybe<Order_Items_Aggregate_Bool_Exp>;
  User?: InputMaybe<Users_Bool_Exp>;
  _and?: InputMaybe<Array<Orders_Bool_Exp>>;
  _not?: InputMaybe<Orders_Bool_Exp>;
  _or?: InputMaybe<Array<Orders_Bool_Exp>>;
  combined_order_id?: InputMaybe<Uuid_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  delivery_address_id?: InputMaybe<Uuid_Comparison_Exp>;
  delivery_notes?: InputMaybe<String_Comparison_Exp>;
  delivery_photo_url?: InputMaybe<String_Comparison_Exp>;
  delivery_time?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  shopper_id?: InputMaybe<Uuid_Comparison_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  total?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  userByUserId?: InputMaybe<Users_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "Orders" */
export enum Orders_Constraint {
  /** unique or primary key constraint on columns "id" */
  OrdersIdKey = "Orders_id_key",
  /** unique or primary key constraint on columns "user_id" */
  OrdersPkey = "Orders_pkey",
}

/** input type for inserting data into table "Orders" */
export type Orders_Insert_Input = {
  Address?: InputMaybe<Addresses_Obj_Rel_Insert_Input>;
  Delivery_Issues?: InputMaybe<Delivery_Issues_Arr_Rel_Insert_Input>;
  Order_Items?: InputMaybe<Order_Items_Arr_Rel_Insert_Input>;
  User?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  combined_order_id?: InputMaybe<Scalars["uuid"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  delivery_address_id?: InputMaybe<Scalars["uuid"]>;
  delivery_notes?: InputMaybe<Scalars["String"]>;
  delivery_photo_url?: InputMaybe<Scalars["String"]>;
  delivery_time?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  shopper_id?: InputMaybe<Scalars["uuid"]>;
  status?: InputMaybe<Scalars["String"]>;
  total?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  userByUserId?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type Orders_Max_Fields = {
  __typename?: "Orders_max_fields";
  combined_order_id?: Maybe<Scalars["uuid"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  delivery_address_id?: Maybe<Scalars["uuid"]>;
  delivery_notes?: Maybe<Scalars["String"]>;
  delivery_photo_url?: Maybe<Scalars["String"]>;
  delivery_time?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  shopper_id?: Maybe<Scalars["uuid"]>;
  status?: Maybe<Scalars["String"]>;
  total?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "Orders" */
export type Orders_Max_Order_By = {
  combined_order_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  delivery_address_id?: InputMaybe<Order_By>;
  delivery_notes?: InputMaybe<Order_By>;
  delivery_photo_url?: InputMaybe<Order_By>;
  delivery_time?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  shopper_id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  total?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Orders_Min_Fields = {
  __typename?: "Orders_min_fields";
  combined_order_id?: Maybe<Scalars["uuid"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  delivery_address_id?: Maybe<Scalars["uuid"]>;
  delivery_notes?: Maybe<Scalars["String"]>;
  delivery_photo_url?: Maybe<Scalars["String"]>;
  delivery_time?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  shopper_id?: Maybe<Scalars["uuid"]>;
  status?: Maybe<Scalars["String"]>;
  total?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "Orders" */
export type Orders_Min_Order_By = {
  combined_order_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  delivery_address_id?: InputMaybe<Order_By>;
  delivery_notes?: InputMaybe<Order_By>;
  delivery_photo_url?: InputMaybe<Order_By>;
  delivery_time?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  shopper_id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  total?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Orders" */
export type Orders_Mutation_Response = {
  __typename?: "Orders_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Orders>;
};

/** input type for inserting object relation for remote table "Orders" */
export type Orders_Obj_Rel_Insert_Input = {
  data: Orders_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Orders_On_Conflict>;
};

/** on_conflict condition type for table "Orders" */
export type Orders_On_Conflict = {
  constraint: Orders_Constraint;
  update_columns?: Array<Orders_Update_Column>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

/** Ordering options when selecting data from "Orders". */
export type Orders_Order_By = {
  Address?: InputMaybe<Addresses_Order_By>;
  Delivery_Issues_aggregate?: InputMaybe<Delivery_Issues_Aggregate_Order_By>;
  Order_Items_aggregate?: InputMaybe<Order_Items_Aggregate_Order_By>;
  User?: InputMaybe<Users_Order_By>;
  combined_order_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  delivery_address_id?: InputMaybe<Order_By>;
  delivery_notes?: InputMaybe<Order_By>;
  delivery_photo_url?: InputMaybe<Order_By>;
  delivery_time?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  shopper_id?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  total?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  userByUserId?: InputMaybe<Users_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Orders */
export type Orders_Pk_Columns_Input = {
  user_id: Scalars["uuid"];
};

/** select columns of table "Orders" */
export enum Orders_Select_Column {
  /** column name */
  CombinedOrderId = "combined_order_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  DeliveryAddressId = "delivery_address_id",
  /** column name */
  DeliveryNotes = "delivery_notes",
  /** column name */
  DeliveryPhotoUrl = "delivery_photo_url",
  /** column name */
  DeliveryTime = "delivery_time",
  /** column name */
  Id = "id",
  /** column name */
  ShopperId = "shopper_id",
  /** column name */
  Status = "status",
  /** column name */
  Total = "total",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

/** input type for updating data in table "Orders" */
export type Orders_Set_Input = {
  combined_order_id?: InputMaybe<Scalars["uuid"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  delivery_address_id?: InputMaybe<Scalars["uuid"]>;
  delivery_notes?: InputMaybe<Scalars["String"]>;
  delivery_photo_url?: InputMaybe<Scalars["String"]>;
  delivery_time?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  shopper_id?: InputMaybe<Scalars["uuid"]>;
  status?: InputMaybe<Scalars["String"]>;
  total?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** Streaming cursor of the table "Orders" */
export type Orders_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Orders_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Orders_Stream_Cursor_Value_Input = {
  combined_order_id?: InputMaybe<Scalars["uuid"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  delivery_address_id?: InputMaybe<Scalars["uuid"]>;
  delivery_notes?: InputMaybe<Scalars["String"]>;
  delivery_photo_url?: InputMaybe<Scalars["String"]>;
  delivery_time?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  shopper_id?: InputMaybe<Scalars["uuid"]>;
  status?: InputMaybe<Scalars["String"]>;
  total?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** update columns of table "Orders" */
export enum Orders_Update_Column {
  /** column name */
  CombinedOrderId = "combined_order_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  DeliveryAddressId = "delivery_address_id",
  /** column name */
  DeliveryNotes = "delivery_notes",
  /** column name */
  DeliveryPhotoUrl = "delivery_photo_url",
  /** column name */
  DeliveryTime = "delivery_time",
  /** column name */
  Id = "id",
  /** column name */
  ShopperId = "shopper_id",
  /** column name */
  Status = "status",
  /** column name */
  Total = "total",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

export type Orders_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Orders_Set_Input>;
  /** filter the rows which have to be updated */
  where: Orders_Bool_Exp;
};

/** Platform Settings */
export type Platform_Settings = {
  __typename?: "Platform_Settings";
  created_at: Scalars["timestamptz"];
  id: Scalars["uuid"];
  key: Scalars["String"];
  updated_at: Scalars["timestamptz"];
  value: Scalars["json"];
};

/** Platform Settings */
export type Platform_SettingsValueArgs = {
  path?: InputMaybe<Scalars["String"]>;
};

/** aggregated selection of "Platform_Settings" */
export type Platform_Settings_Aggregate = {
  __typename?: "Platform_Settings_aggregate";
  aggregate?: Maybe<Platform_Settings_Aggregate_Fields>;
  nodes: Array<Platform_Settings>;
};

/** aggregate fields of "Platform_Settings" */
export type Platform_Settings_Aggregate_Fields = {
  __typename?: "Platform_Settings_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Platform_Settings_Max_Fields>;
  min?: Maybe<Platform_Settings_Min_Fields>;
};

/** aggregate fields of "Platform_Settings" */
export type Platform_Settings_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Platform_Settings_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "Platform_Settings". All fields are combined with a logical 'AND'. */
export type Platform_Settings_Bool_Exp = {
  _and?: InputMaybe<Array<Platform_Settings_Bool_Exp>>;
  _not?: InputMaybe<Platform_Settings_Bool_Exp>;
  _or?: InputMaybe<Array<Platform_Settings_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  key?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  value?: InputMaybe<Json_Comparison_Exp>;
};

/** unique or primary key constraints on table "Platform_Settings" */
export enum Platform_Settings_Constraint {
  /** unique or primary key constraint on columns "key" */
  PlatformSettingsKeyKey = "Platform_Settings_key_key",
  /** unique or primary key constraint on columns "id" */
  PlatformSettingsPkey = "Platform_Settings_pkey",
}

/** input type for inserting data into table "Platform_Settings" */
export type Platform_Settings_Insert_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  key?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  value?: InputMaybe<Scalars["json"]>;
};

/** aggregate max on columns */
export type Platform_Settings_Max_Fields = {
  __typename?: "Platform_Settings_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  key?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** aggregate min on columns */
export type Platform_Settings_Min_Fields = {
  __typename?: "Platform_Settings_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  id?: Maybe<Scalars["uuid"]>;
  key?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["timestamptz"]>;
};

/** response of any mutation on the table "Platform_Settings" */
export type Platform_Settings_Mutation_Response = {
  __typename?: "Platform_Settings_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Platform_Settings>;
};

/** on_conflict condition type for table "Platform_Settings" */
export type Platform_Settings_On_Conflict = {
  constraint: Platform_Settings_Constraint;
  update_columns?: Array<Platform_Settings_Update_Column>;
  where?: InputMaybe<Platform_Settings_Bool_Exp>;
};

/** Ordering options when selecting data from "Platform_Settings". */
export type Platform_Settings_Order_By = {
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  key?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  value?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Platform_Settings */
export type Platform_Settings_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Platform_Settings" */
export enum Platform_Settings_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Key = "key",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  Value = "value",
}

/** input type for updating data in table "Platform_Settings" */
export type Platform_Settings_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  key?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  value?: InputMaybe<Scalars["json"]>;
};

/** Streaming cursor of the table "Platform_Settings" */
export type Platform_Settings_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Platform_Settings_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Platform_Settings_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  key?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["timestamptz"]>;
  value?: InputMaybe<Scalars["json"]>;
};

/** update columns of table "Platform_Settings" */
export enum Platform_Settings_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Id = "id",
  /** column name */
  Key = "key",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  Value = "value",
}

export type Platform_Settings_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Platform_Settings_Set_Input>;
  /** filter the rows which have to be updated */
  where: Platform_Settings_Bool_Exp;
};

/** Products */
export type Products = {
  __typename?: "Products";
  /** An array relationship */
  Cart_Items: Array<Cart_Items>;
  /** An aggregate relationship */
  Cart_Items_aggregate: Cart_Items_Aggregate;
  /** An array relationship */
  Order_Items: Array<Order_Items>;
  /** An aggregate relationship */
  Order_Items_aggregate: Order_Items_Aggregate;
  /** An object relationship */
  Shop: Shops;
  category: Scalars["String"];
  created_at: Scalars["timestamptz"];
  description: Scalars["String"];
  id: Scalars["uuid"];
  image: Scalars["String"];
  is_active: Scalars["Boolean"];
  measurement_unit: Scalars["String"];
  name: Scalars["String"];
  price: Scalars["String"];
  quantity: Scalars["Int"];
  shop_id: Scalars["uuid"];
  updated_at?: Maybe<Scalars["String"]>;
};

/** Products */
export type ProductsCart_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Cart_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cart_Items_Order_By>>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

/** Products */
export type ProductsCart_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Cart_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cart_Items_Order_By>>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

/** Products */
export type ProductsOrder_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Order_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Order_Items_Order_By>>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

/** Products */
export type ProductsOrder_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Order_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Order_Items_Order_By>>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

/** aggregated selection of "Products" */
export type Products_Aggregate = {
  __typename?: "Products_aggregate";
  aggregate?: Maybe<Products_Aggregate_Fields>;
  nodes: Array<Products>;
};

export type Products_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Products_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Products_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Products_Aggregate_Bool_Exp_Count>;
};

export type Products_Aggregate_Bool_Exp_Bool_And = {
  arguments: Products_Select_Column_Products_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Products_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Products_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Products_Select_Column_Products_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Products_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Products_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Products_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Products_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Products" */
export type Products_Aggregate_Fields = {
  __typename?: "Products_aggregate_fields";
  avg?: Maybe<Products_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Products_Max_Fields>;
  min?: Maybe<Products_Min_Fields>;
  stddev?: Maybe<Products_Stddev_Fields>;
  stddev_pop?: Maybe<Products_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Products_Stddev_Samp_Fields>;
  sum?: Maybe<Products_Sum_Fields>;
  var_pop?: Maybe<Products_Var_Pop_Fields>;
  var_samp?: Maybe<Products_Var_Samp_Fields>;
  variance?: Maybe<Products_Variance_Fields>;
};

/** aggregate fields of "Products" */
export type Products_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Products_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Products" */
export type Products_Aggregate_Order_By = {
  avg?: InputMaybe<Products_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Products_Max_Order_By>;
  min?: InputMaybe<Products_Min_Order_By>;
  stddev?: InputMaybe<Products_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Products_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Products_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Products_Sum_Order_By>;
  var_pop?: InputMaybe<Products_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Products_Var_Samp_Order_By>;
  variance?: InputMaybe<Products_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Products" */
export type Products_Arr_Rel_Insert_Input = {
  data: Array<Products_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Products_On_Conflict>;
};

/** aggregate avg on columns */
export type Products_Avg_Fields = {
  __typename?: "Products_avg_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "Products" */
export type Products_Avg_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Products". All fields are combined with a logical 'AND'. */
export type Products_Bool_Exp = {
  Cart_Items?: InputMaybe<Cart_Items_Bool_Exp>;
  Cart_Items_aggregate?: InputMaybe<Cart_Items_Aggregate_Bool_Exp>;
  Order_Items?: InputMaybe<Order_Items_Bool_Exp>;
  Order_Items_aggregate?: InputMaybe<Order_Items_Aggregate_Bool_Exp>;
  Shop?: InputMaybe<Shops_Bool_Exp>;
  _and?: InputMaybe<Array<Products_Bool_Exp>>;
  _not?: InputMaybe<Products_Bool_Exp>;
  _or?: InputMaybe<Array<Products_Bool_Exp>>;
  category?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  is_active?: InputMaybe<Boolean_Comparison_Exp>;
  measurement_unit?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  price?: InputMaybe<String_Comparison_Exp>;
  quantity?: InputMaybe<Int_Comparison_Exp>;
  shop_id?: InputMaybe<Uuid_Comparison_Exp>;
  updated_at?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "Products" */
export enum Products_Constraint {
  /** unique or primary key constraint on columns "id" */
  ProductsPkey = "Products_pkey",
}

/** input type for incrementing numeric columns in table "Products" */
export type Products_Inc_Input = {
  quantity?: InputMaybe<Scalars["Int"]>;
};

/** input type for inserting data into table "Products" */
export type Products_Insert_Input = {
  Cart_Items?: InputMaybe<Cart_Items_Arr_Rel_Insert_Input>;
  Order_Items?: InputMaybe<Order_Items_Arr_Rel_Insert_Input>;
  Shop?: InputMaybe<Shops_Obj_Rel_Insert_Input>;
  category?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  image?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  measurement_unit?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  price?: InputMaybe<Scalars["String"]>;
  quantity?: InputMaybe<Scalars["Int"]>;
  shop_id?: InputMaybe<Scalars["uuid"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Products_Max_Fields = {
  __typename?: "Products_max_fields";
  category?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  image?: Maybe<Scalars["String"]>;
  measurement_unit?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  price?: Maybe<Scalars["String"]>;
  quantity?: Maybe<Scalars["Int"]>;
  shop_id?: Maybe<Scalars["uuid"]>;
  updated_at?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "Products" */
export type Products_Max_Order_By = {
  category?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  measurement_unit?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  quantity?: InputMaybe<Order_By>;
  shop_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Products_Min_Fields = {
  __typename?: "Products_min_fields";
  category?: Maybe<Scalars["String"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  image?: Maybe<Scalars["String"]>;
  measurement_unit?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  price?: Maybe<Scalars["String"]>;
  quantity?: Maybe<Scalars["Int"]>;
  shop_id?: Maybe<Scalars["uuid"]>;
  updated_at?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "Products" */
export type Products_Min_Order_By = {
  category?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  measurement_unit?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  quantity?: InputMaybe<Order_By>;
  shop_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Products" */
export type Products_Mutation_Response = {
  __typename?: "Products_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Products>;
};

/** input type for inserting object relation for remote table "Products" */
export type Products_Obj_Rel_Insert_Input = {
  data: Products_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Products_On_Conflict>;
};

/** on_conflict condition type for table "Products" */
export type Products_On_Conflict = {
  constraint: Products_Constraint;
  update_columns?: Array<Products_Update_Column>;
  where?: InputMaybe<Products_Bool_Exp>;
};

/** Ordering options when selecting data from "Products". */
export type Products_Order_By = {
  Cart_Items_aggregate?: InputMaybe<Cart_Items_Aggregate_Order_By>;
  Order_Items_aggregate?: InputMaybe<Order_Items_Aggregate_Order_By>;
  Shop?: InputMaybe<Shops_Order_By>;
  category?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  is_active?: InputMaybe<Order_By>;
  measurement_unit?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
  quantity?: InputMaybe<Order_By>;
  shop_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Products */
export type Products_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Products" */
export enum Products_Select_Column {
  /** column name */
  Category = "category",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  Id = "id",
  /** column name */
  Image = "image",
  /** column name */
  IsActive = "is_active",
  /** column name */
  MeasurementUnit = "measurement_unit",
  /** column name */
  Name = "name",
  /** column name */
  Price = "price",
  /** column name */
  Quantity = "quantity",
  /** column name */
  ShopId = "shop_id",
  /** column name */
  UpdatedAt = "updated_at",
}

/** select "Products_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Products" */
export enum Products_Select_Column_Products_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  IsActive = "is_active",
}

/** select "Products_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Products" */
export enum Products_Select_Column_Products_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  IsActive = "is_active",
}

/** input type for updating data in table "Products" */
export type Products_Set_Input = {
  category?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  image?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  measurement_unit?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  price?: InputMaybe<Scalars["String"]>;
  quantity?: InputMaybe<Scalars["Int"]>;
  shop_id?: InputMaybe<Scalars["uuid"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** aggregate stddev on columns */
export type Products_Stddev_Fields = {
  __typename?: "Products_stddev_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "Products" */
export type Products_Stddev_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Products_Stddev_Pop_Fields = {
  __typename?: "Products_stddev_pop_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "Products" */
export type Products_Stddev_Pop_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Products_Stddev_Samp_Fields = {
  __typename?: "Products_stddev_samp_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "Products" */
export type Products_Stddev_Samp_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "Products" */
export type Products_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Products_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Products_Stream_Cursor_Value_Input = {
  category?: InputMaybe<Scalars["String"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  image?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  measurement_unit?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  price?: InputMaybe<Scalars["String"]>;
  quantity?: InputMaybe<Scalars["Int"]>;
  shop_id?: InputMaybe<Scalars["uuid"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** aggregate sum on columns */
export type Products_Sum_Fields = {
  __typename?: "Products_sum_fields";
  quantity?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "Products" */
export type Products_Sum_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** update columns of table "Products" */
export enum Products_Update_Column {
  /** column name */
  Category = "category",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  Id = "id",
  /** column name */
  Image = "image",
  /** column name */
  IsActive = "is_active",
  /** column name */
  MeasurementUnit = "measurement_unit",
  /** column name */
  Name = "name",
  /** column name */
  Price = "price",
  /** column name */
  Quantity = "quantity",
  /** column name */
  ShopId = "shop_id",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Products_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Products_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Products_Set_Input>;
  /** filter the rows which have to be updated */
  where: Products_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Products_Var_Pop_Fields = {
  __typename?: "Products_var_pop_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "Products" */
export type Products_Var_Pop_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Products_Var_Samp_Fields = {
  __typename?: "Products_var_samp_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "Products" */
export type Products_Var_Samp_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Products_Variance_Fields = {
  __typename?: "Products_variance_fields";
  quantity?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "Products" */
export type Products_Variance_Order_By = {
  quantity?: InputMaybe<Order_By>;
};

/** columns and relationships of "Shopper_Availability" */
export type Shopper_Availability = {
  __typename?: "Shopper_Availability";
  /** An object relationship */
  User: Users;
  created_at: Scalars["timestamptz"];
  day_of_week: Scalars["Int"];
  end_time: Scalars["timetz"];
  id: Scalars["uuid"];
  is_available: Scalars["Boolean"];
  start_time: Scalars["timetz"];
  updated_at: Scalars["String"];
  user_id: Scalars["uuid"];
};

/** aggregated selection of "Shopper_Availability" */
export type Shopper_Availability_Aggregate = {
  __typename?: "Shopper_Availability_aggregate";
  aggregate?: Maybe<Shopper_Availability_Aggregate_Fields>;
  nodes: Array<Shopper_Availability>;
};

export type Shopper_Availability_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Shopper_Availability_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Shopper_Availability_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Shopper_Availability_Aggregate_Bool_Exp_Count>;
};

export type Shopper_Availability_Aggregate_Bool_Exp_Bool_And = {
  arguments: Shopper_Availability_Select_Column_Shopper_Availability_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Shopper_Availability_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Shopper_Availability_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Shopper_Availability_Select_Column_Shopper_Availability_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Shopper_Availability_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Shopper_Availability_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Shopper_Availability_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Shopper_Availability_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Shopper_Availability" */
export type Shopper_Availability_Aggregate_Fields = {
  __typename?: "Shopper_Availability_aggregate_fields";
  avg?: Maybe<Shopper_Availability_Avg_Fields>;
  count: Scalars["Int"];
  max?: Maybe<Shopper_Availability_Max_Fields>;
  min?: Maybe<Shopper_Availability_Min_Fields>;
  stddev?: Maybe<Shopper_Availability_Stddev_Fields>;
  stddev_pop?: Maybe<Shopper_Availability_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Shopper_Availability_Stddev_Samp_Fields>;
  sum?: Maybe<Shopper_Availability_Sum_Fields>;
  var_pop?: Maybe<Shopper_Availability_Var_Pop_Fields>;
  var_samp?: Maybe<Shopper_Availability_Var_Samp_Fields>;
  variance?: Maybe<Shopper_Availability_Variance_Fields>;
};

/** aggregate fields of "Shopper_Availability" */
export type Shopper_Availability_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Shopper_Availability_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Shopper_Availability" */
export type Shopper_Availability_Aggregate_Order_By = {
  avg?: InputMaybe<Shopper_Availability_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Shopper_Availability_Max_Order_By>;
  min?: InputMaybe<Shopper_Availability_Min_Order_By>;
  stddev?: InputMaybe<Shopper_Availability_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Shopper_Availability_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Shopper_Availability_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Shopper_Availability_Sum_Order_By>;
  var_pop?: InputMaybe<Shopper_Availability_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Shopper_Availability_Var_Samp_Order_By>;
  variance?: InputMaybe<Shopper_Availability_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "Shopper_Availability" */
export type Shopper_Availability_Arr_Rel_Insert_Input = {
  data: Array<Shopper_Availability_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Shopper_Availability_On_Conflict>;
};

/** aggregate avg on columns */
export type Shopper_Availability_Avg_Fields = {
  __typename?: "Shopper_Availability_avg_fields";
  day_of_week?: Maybe<Scalars["Float"]>;
};

/** order by avg() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Avg_Order_By = {
  day_of_week?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "Shopper_Availability". All fields are combined with a logical 'AND'. */
export type Shopper_Availability_Bool_Exp = {
  User?: InputMaybe<Users_Bool_Exp>;
  _and?: InputMaybe<Array<Shopper_Availability_Bool_Exp>>;
  _not?: InputMaybe<Shopper_Availability_Bool_Exp>;
  _or?: InputMaybe<Array<Shopper_Availability_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  day_of_week?: InputMaybe<Int_Comparison_Exp>;
  end_time?: InputMaybe<Timetz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  is_available?: InputMaybe<Boolean_Comparison_Exp>;
  start_time?: InputMaybe<Timetz_Comparison_Exp>;
  updated_at?: InputMaybe<String_Comparison_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "Shopper_Availability" */
export enum Shopper_Availability_Constraint {
  /** unique or primary key constraint on columns "id" */
  ShopperAvailabilityPkey = "Shopper_Availability_pkey",
}

/** input type for incrementing numeric columns in table "Shopper_Availability" */
export type Shopper_Availability_Inc_Input = {
  day_of_week?: InputMaybe<Scalars["Int"]>;
};

/** input type for inserting data into table "Shopper_Availability" */
export type Shopper_Availability_Insert_Input = {
  User?: InputMaybe<Users_Obj_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  day_of_week?: InputMaybe<Scalars["Int"]>;
  end_time?: InputMaybe<Scalars["timetz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_available?: InputMaybe<Scalars["Boolean"]>;
  start_time?: InputMaybe<Scalars["timetz"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** aggregate max on columns */
export type Shopper_Availability_Max_Fields = {
  __typename?: "Shopper_Availability_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  day_of_week?: Maybe<Scalars["Int"]>;
  end_time?: Maybe<Scalars["timetz"]>;
  id?: Maybe<Scalars["uuid"]>;
  start_time?: Maybe<Scalars["timetz"]>;
  updated_at?: Maybe<Scalars["String"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by max() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  day_of_week?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  start_time?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Shopper_Availability_Min_Fields = {
  __typename?: "Shopper_Availability_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  day_of_week?: Maybe<Scalars["Int"]>;
  end_time?: Maybe<Scalars["timetz"]>;
  id?: Maybe<Scalars["uuid"]>;
  start_time?: Maybe<Scalars["timetz"]>;
  updated_at?: Maybe<Scalars["String"]>;
  user_id?: Maybe<Scalars["uuid"]>;
};

/** order by min() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  day_of_week?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  start_time?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Shopper_Availability" */
export type Shopper_Availability_Mutation_Response = {
  __typename?: "Shopper_Availability_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Shopper_Availability>;
};

/** on_conflict condition type for table "Shopper_Availability" */
export type Shopper_Availability_On_Conflict = {
  constraint: Shopper_Availability_Constraint;
  update_columns?: Array<Shopper_Availability_Update_Column>;
  where?: InputMaybe<Shopper_Availability_Bool_Exp>;
};

/** Ordering options when selecting data from "Shopper_Availability". */
export type Shopper_Availability_Order_By = {
  User?: InputMaybe<Users_Order_By>;
  created_at?: InputMaybe<Order_By>;
  day_of_week?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_available?: InputMaybe<Order_By>;
  start_time?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Shopper_Availability */
export type Shopper_Availability_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Shopper_Availability" */
export enum Shopper_Availability_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  DayOfWeek = "day_of_week",
  /** column name */
  EndTime = "end_time",
  /** column name */
  Id = "id",
  /** column name */
  IsAvailable = "is_available",
  /** column name */
  StartTime = "start_time",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

/** select "Shopper_Availability_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Shopper_Availability" */
export enum Shopper_Availability_Select_Column_Shopper_Availability_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  IsAvailable = "is_available",
}

/** select "Shopper_Availability_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Shopper_Availability" */
export enum Shopper_Availability_Select_Column_Shopper_Availability_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  IsAvailable = "is_available",
}

/** input type for updating data in table "Shopper_Availability" */
export type Shopper_Availability_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  day_of_week?: InputMaybe<Scalars["Int"]>;
  end_time?: InputMaybe<Scalars["timetz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_available?: InputMaybe<Scalars["Boolean"]>;
  start_time?: InputMaybe<Scalars["timetz"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** aggregate stddev on columns */
export type Shopper_Availability_Stddev_Fields = {
  __typename?: "Shopper_Availability_stddev_fields";
  day_of_week?: Maybe<Scalars["Float"]>;
};

/** order by stddev() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Stddev_Order_By = {
  day_of_week?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Shopper_Availability_Stddev_Pop_Fields = {
  __typename?: "Shopper_Availability_stddev_pop_fields";
  day_of_week?: Maybe<Scalars["Float"]>;
};

/** order by stddev_pop() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Stddev_Pop_Order_By = {
  day_of_week?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Shopper_Availability_Stddev_Samp_Fields = {
  __typename?: "Shopper_Availability_stddev_samp_fields";
  day_of_week?: Maybe<Scalars["Float"]>;
};

/** order by stddev_samp() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Stddev_Samp_Order_By = {
  day_of_week?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "Shopper_Availability" */
export type Shopper_Availability_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Shopper_Availability_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Shopper_Availability_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  day_of_week?: InputMaybe<Scalars["Int"]>;
  end_time?: InputMaybe<Scalars["timetz"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_available?: InputMaybe<Scalars["Boolean"]>;
  start_time?: InputMaybe<Scalars["timetz"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
  user_id?: InputMaybe<Scalars["uuid"]>;
};

/** aggregate sum on columns */
export type Shopper_Availability_Sum_Fields = {
  __typename?: "Shopper_Availability_sum_fields";
  day_of_week?: Maybe<Scalars["Int"]>;
};

/** order by sum() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Sum_Order_By = {
  day_of_week?: InputMaybe<Order_By>;
};

/** update columns of table "Shopper_Availability" */
export enum Shopper_Availability_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  DayOfWeek = "day_of_week",
  /** column name */
  EndTime = "end_time",
  /** column name */
  Id = "id",
  /** column name */
  IsAvailable = "is_available",
  /** column name */
  StartTime = "start_time",
  /** column name */
  UpdatedAt = "updated_at",
  /** column name */
  UserId = "user_id",
}

export type Shopper_Availability_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Shopper_Availability_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Shopper_Availability_Set_Input>;
  /** filter the rows which have to be updated */
  where: Shopper_Availability_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Shopper_Availability_Var_Pop_Fields = {
  __typename?: "Shopper_Availability_var_pop_fields";
  day_of_week?: Maybe<Scalars["Float"]>;
};

/** order by var_pop() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Var_Pop_Order_By = {
  day_of_week?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Shopper_Availability_Var_Samp_Fields = {
  __typename?: "Shopper_Availability_var_samp_fields";
  day_of_week?: Maybe<Scalars["Float"]>;
};

/** order by var_samp() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Var_Samp_Order_By = {
  day_of_week?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Shopper_Availability_Variance_Fields = {
  __typename?: "Shopper_Availability_variance_fields";
  day_of_week?: Maybe<Scalars["Float"]>;
};

/** order by variance() on columns of table "Shopper_Availability" */
export type Shopper_Availability_Variance_Order_By = {
  day_of_week?: InputMaybe<Order_By>;
};

/** Shops */
export type Shops = {
  __typename?: "Shops";
  /** An object relationship */
  Category: Categories;
  /** An array relationship */
  Products: Array<Products>;
  /** An aggregate relationship */
  Products_aggregate: Products_Aggregate;
  address: Scalars["String"];
  category_id: Scalars["uuid"];
  created_at: Scalars["timestamptz"];
  description: Scalars["String"];
  id: Scalars["uuid"];
  image: Scalars["String"];
  is_active: Scalars["Boolean"];
  latitude: Scalars["String"];
  longitude: Scalars["String"];
  name: Scalars["String"];
  operating_hours: Scalars["json"];
  updated_at: Scalars["String"];
};

/** Shops */
export type ShopsProductsArgs = {
  distinct_on?: InputMaybe<Array<Products_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Products_Order_By>>;
  where?: InputMaybe<Products_Bool_Exp>;
};

/** Shops */
export type ShopsProducts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Products_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Products_Order_By>>;
  where?: InputMaybe<Products_Bool_Exp>;
};

/** Shops */
export type ShopsOperating_HoursArgs = {
  path?: InputMaybe<Scalars["String"]>;
};

/** aggregated selection of "Shops" */
export type Shops_Aggregate = {
  __typename?: "Shops_aggregate";
  aggregate?: Maybe<Shops_Aggregate_Fields>;
  nodes: Array<Shops>;
};

export type Shops_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Shops_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Shops_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Shops_Aggregate_Bool_Exp_Count>;
};

export type Shops_Aggregate_Bool_Exp_Bool_And = {
  arguments: Shops_Select_Column_Shops_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Shops_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Shops_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Shops_Select_Column_Shops_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Shops_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Shops_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Shops_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
  filter?: InputMaybe<Shops_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "Shops" */
export type Shops_Aggregate_Fields = {
  __typename?: "Shops_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Shops_Max_Fields>;
  min?: Maybe<Shops_Min_Fields>;
};

/** aggregate fields of "Shops" */
export type Shops_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Shops_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** order by aggregate values of table "Shops" */
export type Shops_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Shops_Max_Order_By>;
  min?: InputMaybe<Shops_Min_Order_By>;
};

/** input type for inserting array relation for remote table "Shops" */
export type Shops_Arr_Rel_Insert_Input = {
  data: Array<Shops_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Shops_On_Conflict>;
};

/** Boolean expression to filter rows from the table "Shops". All fields are combined with a logical 'AND'. */
export type Shops_Bool_Exp = {
  Category?: InputMaybe<Categories_Bool_Exp>;
  Products?: InputMaybe<Products_Bool_Exp>;
  Products_aggregate?: InputMaybe<Products_Aggregate_Bool_Exp>;
  _and?: InputMaybe<Array<Shops_Bool_Exp>>;
  _not?: InputMaybe<Shops_Bool_Exp>;
  _or?: InputMaybe<Array<Shops_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  category_id?: InputMaybe<Uuid_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  is_active?: InputMaybe<Boolean_Comparison_Exp>;
  latitude?: InputMaybe<String_Comparison_Exp>;
  longitude?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  operating_hours?: InputMaybe<Json_Comparison_Exp>;
  updated_at?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "Shops" */
export enum Shops_Constraint {
  /** unique or primary key constraint on columns "name" */
  ShopsNameKey = "Shops_name_key",
  /** unique or primary key constraint on columns "id" */
  ShopsPkey = "Shops_pkey",
}

/** input type for inserting data into table "Shops" */
export type Shops_Insert_Input = {
  Category?: InputMaybe<Categories_Obj_Rel_Insert_Input>;
  Products?: InputMaybe<Products_Arr_Rel_Insert_Input>;
  address?: InputMaybe<Scalars["String"]>;
  category_id?: InputMaybe<Scalars["uuid"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  image?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  latitude?: InputMaybe<Scalars["String"]>;
  longitude?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  operating_hours?: InputMaybe<Scalars["json"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Shops_Max_Fields = {
  __typename?: "Shops_max_fields";
  address?: Maybe<Scalars["String"]>;
  category_id?: Maybe<Scalars["uuid"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  image?: Maybe<Scalars["String"]>;
  latitude?: Maybe<Scalars["String"]>;
  longitude?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["String"]>;
};

/** order by max() on columns of table "Shops" */
export type Shops_Max_Order_By = {
  address?: InputMaybe<Order_By>;
  category_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  latitude?: InputMaybe<Order_By>;
  longitude?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Shops_Min_Fields = {
  __typename?: "Shops_min_fields";
  address?: Maybe<Scalars["String"]>;
  category_id?: Maybe<Scalars["uuid"]>;
  created_at?: Maybe<Scalars["timestamptz"]>;
  description?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  image?: Maybe<Scalars["String"]>;
  latitude?: Maybe<Scalars["String"]>;
  longitude?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["String"]>;
};

/** order by min() on columns of table "Shops" */
export type Shops_Min_Order_By = {
  address?: InputMaybe<Order_By>;
  category_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  latitude?: InputMaybe<Order_By>;
  longitude?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "Shops" */
export type Shops_Mutation_Response = {
  __typename?: "Shops_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Shops>;
};

/** input type for inserting object relation for remote table "Shops" */
export type Shops_Obj_Rel_Insert_Input = {
  data: Shops_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Shops_On_Conflict>;
};

/** on_conflict condition type for table "Shops" */
export type Shops_On_Conflict = {
  constraint: Shops_Constraint;
  update_columns?: Array<Shops_Update_Column>;
  where?: InputMaybe<Shops_Bool_Exp>;
};

/** Ordering options when selecting data from "Shops". */
export type Shops_Order_By = {
  Category?: InputMaybe<Categories_Order_By>;
  Products_aggregate?: InputMaybe<Products_Aggregate_Order_By>;
  address?: InputMaybe<Order_By>;
  category_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  is_active?: InputMaybe<Order_By>;
  latitude?: InputMaybe<Order_By>;
  longitude?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  operating_hours?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Shops */
export type Shops_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Shops" */
export enum Shops_Select_Column {
  /** column name */
  Address = "address",
  /** column name */
  CategoryId = "category_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  Id = "id",
  /** column name */
  Image = "image",
  /** column name */
  IsActive = "is_active",
  /** column name */
  Latitude = "latitude",
  /** column name */
  Longitude = "longitude",
  /** column name */
  Name = "name",
  /** column name */
  OperatingHours = "operating_hours",
  /** column name */
  UpdatedAt = "updated_at",
}

/** select "Shops_aggregate_bool_exp_bool_and_arguments_columns" columns of table "Shops" */
export enum Shops_Select_Column_Shops_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  IsActive = "is_active",
}

/** select "Shops_aggregate_bool_exp_bool_or_arguments_columns" columns of table "Shops" */
export enum Shops_Select_Column_Shops_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  IsActive = "is_active",
}

/** input type for updating data in table "Shops" */
export type Shops_Set_Input = {
  address?: InputMaybe<Scalars["String"]>;
  category_id?: InputMaybe<Scalars["uuid"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  image?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  latitude?: InputMaybe<Scalars["String"]>;
  longitude?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  operating_hours?: InputMaybe<Scalars["json"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "Shops" */
export type Shops_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Shops_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Shops_Stream_Cursor_Value_Input = {
  address?: InputMaybe<Scalars["String"]>;
  category_id?: InputMaybe<Scalars["uuid"]>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  description?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  image?: InputMaybe<Scalars["String"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  latitude?: InputMaybe<Scalars["String"]>;
  longitude?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  operating_hours?: InputMaybe<Scalars["json"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "Shops" */
export enum Shops_Update_Column {
  /** column name */
  Address = "address",
  /** column name */
  CategoryId = "category_id",
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Description = "description",
  /** column name */
  Id = "id",
  /** column name */
  Image = "image",
  /** column name */
  IsActive = "is_active",
  /** column name */
  Latitude = "latitude",
  /** column name */
  Longitude = "longitude",
  /** column name */
  Name = "name",
  /** column name */
  OperatingHours = "operating_hours",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Shops_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Shops_Set_Input>;
  /** filter the rows which have to be updated */
  where: Shops_Bool_Exp;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["String"]>;
  _gt?: InputMaybe<Scalars["String"]>;
  _gte?: InputMaybe<Scalars["String"]>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars["String"]>;
  _in?: InputMaybe<Array<Scalars["String"]>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars["String"]>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars["String"]>;
  _lt?: InputMaybe<Scalars["String"]>;
  _lte?: InputMaybe<Scalars["String"]>;
  _neq?: InputMaybe<Scalars["String"]>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars["String"]>;
  _nin?: InputMaybe<Array<Scalars["String"]>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars["String"]>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars["String"]>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars["String"]>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars["String"]>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars["String"]>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars["String"]>;
};

/** Users */
export type Users = {
  __typename?: "Users";
  /** An array relationship */
  Addresses: Array<Addresses>;
  /** An aggregate relationship */
  Addresses_aggregate: Addresses_Aggregate;
  /** An array relationship */
  Carts: Array<Carts>;
  /** An aggregate relationship */
  Carts_aggregate: Carts_Aggregate;
  /** An array relationship */
  Delivery_Issues: Array<Delivery_Issues>;
  /** An aggregate relationship */
  Delivery_Issues_aggregate: Delivery_Issues_Aggregate;
  /** An array relationship */
  Notifications: Array<Notifications>;
  /** An aggregate relationship */
  Notifications_aggregate: Notifications_Aggregate;
  /** An object relationship */
  Order?: Maybe<Orders>;
  /** An array relationship */
  Orders: Array<Orders>;
  /** An aggregate relationship */
  Orders_aggregate: Orders_Aggregate;
  /** An array relationship */
  Shopper_Availabilities: Array<Shopper_Availability>;
  /** An aggregate relationship */
  Shopper_Availabilities_aggregate: Shopper_Availability_Aggregate;
  created_at: Scalars["timestamptz"];
  email: Scalars["String"];
  id: Scalars["uuid"];
  is_active: Scalars["Boolean"];
  name: Scalars["String"];
  password_hash: Scalars["String"];
  phone: Scalars["String"];
  profile_picture?: Maybe<Scalars["String"]>;
  role: Scalars["String"];
  updated_at?: Maybe<Scalars["String"]>;
};

/** Users */
export type UsersAddressesArgs = {
  distinct_on?: InputMaybe<Array<Addresses_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Addresses_Order_By>>;
  where?: InputMaybe<Addresses_Bool_Exp>;
};

/** Users */
export type UsersAddresses_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Addresses_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Addresses_Order_By>>;
  where?: InputMaybe<Addresses_Bool_Exp>;
};

/** Users */
export type UsersCartsArgs = {
  distinct_on?: InputMaybe<Array<Carts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Carts_Order_By>>;
  where?: InputMaybe<Carts_Bool_Exp>;
};

/** Users */
export type UsersCarts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Carts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Carts_Order_By>>;
  where?: InputMaybe<Carts_Bool_Exp>;
};

/** Users */
export type UsersDelivery_IssuesArgs = {
  distinct_on?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Delivery_Issues_Order_By>>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

/** Users */
export type UsersDelivery_Issues_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Delivery_Issues_Order_By>>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

/** Users */
export type UsersNotificationsArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

/** Users */
export type UsersNotifications_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

/** Users */
export type UsersOrdersArgs = {
  distinct_on?: InputMaybe<Array<Orders_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Orders_Order_By>>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

/** Users */
export type UsersOrders_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Orders_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Orders_Order_By>>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

/** Users */
export type UsersShopper_AvailabilitiesArgs = {
  distinct_on?: InputMaybe<Array<Shopper_Availability_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shopper_Availability_Order_By>>;
  where?: InputMaybe<Shopper_Availability_Bool_Exp>;
};

/** Users */
export type UsersShopper_Availabilities_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Shopper_Availability_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shopper_Availability_Order_By>>;
  where?: InputMaybe<Shopper_Availability_Bool_Exp>;
};

/** aggregated selection of "Users" */
export type Users_Aggregate = {
  __typename?: "Users_aggregate";
  aggregate?: Maybe<Users_Aggregate_Fields>;
  nodes: Array<Users>;
};

/** aggregate fields of "Users" */
export type Users_Aggregate_Fields = {
  __typename?: "Users_aggregate_fields";
  count: Scalars["Int"];
  max?: Maybe<Users_Max_Fields>;
  min?: Maybe<Users_Min_Fields>;
};

/** aggregate fields of "Users" */
export type Users_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Users_Select_Column>>;
  distinct?: InputMaybe<Scalars["Boolean"]>;
};

/** Boolean expression to filter rows from the table "Users". All fields are combined with a logical 'AND'. */
export type Users_Bool_Exp = {
  Addresses?: InputMaybe<Addresses_Bool_Exp>;
  Addresses_aggregate?: InputMaybe<Addresses_Aggregate_Bool_Exp>;
  Carts?: InputMaybe<Carts_Bool_Exp>;
  Carts_aggregate?: InputMaybe<Carts_Aggregate_Bool_Exp>;
  Delivery_Issues?: InputMaybe<Delivery_Issues_Bool_Exp>;
  Delivery_Issues_aggregate?: InputMaybe<Delivery_Issues_Aggregate_Bool_Exp>;
  Notifications?: InputMaybe<Notifications_Bool_Exp>;
  Notifications_aggregate?: InputMaybe<Notifications_Aggregate_Bool_Exp>;
  Order?: InputMaybe<Orders_Bool_Exp>;
  Orders?: InputMaybe<Orders_Bool_Exp>;
  Orders_aggregate?: InputMaybe<Orders_Aggregate_Bool_Exp>;
  Shopper_Availabilities?: InputMaybe<Shopper_Availability_Bool_Exp>;
  Shopper_Availabilities_aggregate?: InputMaybe<Shopper_Availability_Aggregate_Bool_Exp>;
  _and?: InputMaybe<Array<Users_Bool_Exp>>;
  _not?: InputMaybe<Users_Bool_Exp>;
  _or?: InputMaybe<Array<Users_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  email?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  is_active?: InputMaybe<Boolean_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  password_hash?: InputMaybe<String_Comparison_Exp>;
  phone?: InputMaybe<String_Comparison_Exp>;
  profile_picture?: InputMaybe<String_Comparison_Exp>;
  role?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "Users" */
export enum Users_Constraint {
  /** unique or primary key constraint on columns "email" */
  UsersEmailKey = "Users_email_key",
  /** unique or primary key constraint on columns "phone" */
  UsersPhoneKey = "Users_phone_key",
  /** unique or primary key constraint on columns "id" */
  UsersPkey = "Users_pkey",
}

/** input type for inserting data into table "Users" */
export type Users_Insert_Input = {
  Addresses?: InputMaybe<Addresses_Arr_Rel_Insert_Input>;
  Carts?: InputMaybe<Carts_Arr_Rel_Insert_Input>;
  Delivery_Issues?: InputMaybe<Delivery_Issues_Arr_Rel_Insert_Input>;
  Notifications?: InputMaybe<Notifications_Arr_Rel_Insert_Input>;
  Order?: InputMaybe<Orders_Obj_Rel_Insert_Input>;
  Orders?: InputMaybe<Orders_Arr_Rel_Insert_Input>;
  Shopper_Availabilities?: InputMaybe<Shopper_Availability_Arr_Rel_Insert_Input>;
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  email?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
  password_hash?: InputMaybe<Scalars["String"]>;
  phone?: InputMaybe<Scalars["String"]>;
  profile_picture?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** aggregate max on columns */
export type Users_Max_Fields = {
  __typename?: "Users_max_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  email?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  name?: Maybe<Scalars["String"]>;
  password_hash?: Maybe<Scalars["String"]>;
  phone?: Maybe<Scalars["String"]>;
  profile_picture?: Maybe<Scalars["String"]>;
  role?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["String"]>;
};

/** aggregate min on columns */
export type Users_Min_Fields = {
  __typename?: "Users_min_fields";
  created_at?: Maybe<Scalars["timestamptz"]>;
  email?: Maybe<Scalars["String"]>;
  id?: Maybe<Scalars["uuid"]>;
  name?: Maybe<Scalars["String"]>;
  password_hash?: Maybe<Scalars["String"]>;
  phone?: Maybe<Scalars["String"]>;
  profile_picture?: Maybe<Scalars["String"]>;
  role?: Maybe<Scalars["String"]>;
  updated_at?: Maybe<Scalars["String"]>;
};

/** response of any mutation on the table "Users" */
export type Users_Mutation_Response = {
  __typename?: "Users_mutation_response";
  /** number of rows affected by the mutation */
  affected_rows: Scalars["Int"];
  /** data from the rows affected by the mutation */
  returning: Array<Users>;
};

/** input type for inserting object relation for remote table "Users" */
export type Users_Obj_Rel_Insert_Input = {
  data: Users_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Users_On_Conflict>;
};

/** on_conflict condition type for table "Users" */
export type Users_On_Conflict = {
  constraint: Users_Constraint;
  update_columns?: Array<Users_Update_Column>;
  where?: InputMaybe<Users_Bool_Exp>;
};

/** Ordering options when selecting data from "Users". */
export type Users_Order_By = {
  Addresses_aggregate?: InputMaybe<Addresses_Aggregate_Order_By>;
  Carts_aggregate?: InputMaybe<Carts_Aggregate_Order_By>;
  Delivery_Issues_aggregate?: InputMaybe<Delivery_Issues_Aggregate_Order_By>;
  Notifications_aggregate?: InputMaybe<Notifications_Aggregate_Order_By>;
  Order?: InputMaybe<Orders_Order_By>;
  Orders_aggregate?: InputMaybe<Orders_Aggregate_Order_By>;
  Shopper_Availabilities_aggregate?: InputMaybe<Shopper_Availability_Aggregate_Order_By>;
  created_at?: InputMaybe<Order_By>;
  email?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_active?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  password_hash?: InputMaybe<Order_By>;
  phone?: InputMaybe<Order_By>;
  profile_picture?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: Users */
export type Users_Pk_Columns_Input = {
  id: Scalars["uuid"];
};

/** select columns of table "Users" */
export enum Users_Select_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Email = "email",
  /** column name */
  Id = "id",
  /** column name */
  IsActive = "is_active",
  /** column name */
  Name = "name",
  /** column name */
  PasswordHash = "password_hash",
  /** column name */
  Phone = "phone",
  /** column name */
  ProfilePicture = "profile_picture",
  /** column name */
  Role = "role",
  /** column name */
  UpdatedAt = "updated_at",
}

/** input type for updating data in table "Users" */
export type Users_Set_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  email?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
  password_hash?: InputMaybe<Scalars["String"]>;
  phone?: InputMaybe<Scalars["String"]>;
  profile_picture?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** Streaming cursor of the table "Users" */
export type Users_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Users_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Users_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars["timestamptz"]>;
  email?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["uuid"]>;
  is_active?: InputMaybe<Scalars["Boolean"]>;
  name?: InputMaybe<Scalars["String"]>;
  password_hash?: InputMaybe<Scalars["String"]>;
  phone?: InputMaybe<Scalars["String"]>;
  profile_picture?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<Scalars["String"]>;
  updated_at?: InputMaybe<Scalars["String"]>;
};

/** update columns of table "Users" */
export enum Users_Update_Column {
  /** column name */
  CreatedAt = "created_at",
  /** column name */
  Email = "email",
  /** column name */
  Id = "id",
  /** column name */
  IsActive = "is_active",
  /** column name */
  Name = "name",
  /** column name */
  PasswordHash = "password_hash",
  /** column name */
  Phone = "phone",
  /** column name */
  ProfilePicture = "profile_picture",
  /** column name */
  Role = "role",
  /** column name */
  UpdatedAt = "updated_at",
}

export type Users_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Users_Set_Input>;
  /** filter the rows which have to be updated */
  where: Users_Bool_Exp;
};

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = "ASC",
  /** descending ordering of the cursor */
  Desc = "DESC",
}

/** Boolean expression to compare columns of type "json". All fields are combined with logical 'AND'. */
export type Json_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["json"]>;
  _gt?: InputMaybe<Scalars["json"]>;
  _gte?: InputMaybe<Scalars["json"]>;
  _in?: InputMaybe<Array<Scalars["json"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["json"]>;
  _lte?: InputMaybe<Scalars["json"]>;
  _neq?: InputMaybe<Scalars["json"]>;
  _nin?: InputMaybe<Array<Scalars["json"]>>;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: "mutation_root";
  /** delete data from the table: "Addresses" */
  delete_Addresses?: Maybe<Addresses_Mutation_Response>;
  /** delete single row from the table: "Addresses" */
  delete_Addresses_by_pk?: Maybe<Addresses>;
  /** delete data from the table: "Cart_Items" */
  delete_Cart_Items?: Maybe<Cart_Items_Mutation_Response>;
  /** delete single row from the table: "Cart_Items" */
  delete_Cart_Items_by_pk?: Maybe<Cart_Items>;
  /** delete data from the table: "Carts" */
  delete_Carts?: Maybe<Carts_Mutation_Response>;
  /** delete single row from the table: "Carts" */
  delete_Carts_by_pk?: Maybe<Carts>;
  /** delete data from the table: "Categories" */
  delete_Categories?: Maybe<Categories_Mutation_Response>;
  /** delete single row from the table: "Categories" */
  delete_Categories_by_pk?: Maybe<Categories>;
  /** delete data from the table: "Delivery_Issues" */
  delete_Delivery_Issues?: Maybe<Delivery_Issues_Mutation_Response>;
  /** delete single row from the table: "Delivery_Issues" */
  delete_Delivery_Issues_by_pk?: Maybe<Delivery_Issues>;
  /** delete data from the table: "Notifications" */
  delete_Notifications?: Maybe<Notifications_Mutation_Response>;
  /** delete single row from the table: "Notifications" */
  delete_Notifications_by_pk?: Maybe<Notifications>;
  /** delete data from the table: "Order_Items" */
  delete_Order_Items?: Maybe<Order_Items_Mutation_Response>;
  /** delete single row from the table: "Order_Items" */
  delete_Order_Items_by_pk?: Maybe<Order_Items>;
  /** delete data from the table: "Orders" */
  delete_Orders?: Maybe<Orders_Mutation_Response>;
  /** delete single row from the table: "Orders" */
  delete_Orders_by_pk?: Maybe<Orders>;
  /** delete data from the table: "Platform_Settings" */
  delete_Platform_Settings?: Maybe<Platform_Settings_Mutation_Response>;
  /** delete single row from the table: "Platform_Settings" */
  delete_Platform_Settings_by_pk?: Maybe<Platform_Settings>;
  /** delete data from the table: "Products" */
  delete_Products?: Maybe<Products_Mutation_Response>;
  /** delete single row from the table: "Products" */
  delete_Products_by_pk?: Maybe<Products>;
  /** delete data from the table: "Shopper_Availability" */
  delete_Shopper_Availability?: Maybe<Shopper_Availability_Mutation_Response>;
  /** delete single row from the table: "Shopper_Availability" */
  delete_Shopper_Availability_by_pk?: Maybe<Shopper_Availability>;
  /** delete data from the table: "Shops" */
  delete_Shops?: Maybe<Shops_Mutation_Response>;
  /** delete single row from the table: "Shops" */
  delete_Shops_by_pk?: Maybe<Shops>;
  /** delete data from the table: "Users" */
  delete_Users?: Maybe<Users_Mutation_Response>;
  /** delete single row from the table: "Users" */
  delete_Users_by_pk?: Maybe<Users>;
  /** insert data into the table: "Addresses" */
  insert_Addresses?: Maybe<Addresses_Mutation_Response>;
  /** insert a single row into the table: "Addresses" */
  insert_Addresses_one?: Maybe<Addresses>;
  /** insert data into the table: "Cart_Items" */
  insert_Cart_Items?: Maybe<Cart_Items_Mutation_Response>;
  /** insert a single row into the table: "Cart_Items" */
  insert_Cart_Items_one?: Maybe<Cart_Items>;
  /** insert data into the table: "Carts" */
  insert_Carts?: Maybe<Carts_Mutation_Response>;
  /** insert a single row into the table: "Carts" */
  insert_Carts_one?: Maybe<Carts>;
  /** insert data into the table: "Categories" */
  insert_Categories?: Maybe<Categories_Mutation_Response>;
  /** insert a single row into the table: "Categories" */
  insert_Categories_one?: Maybe<Categories>;
  /** insert data into the table: "Delivery_Issues" */
  insert_Delivery_Issues?: Maybe<Delivery_Issues_Mutation_Response>;
  /** insert a single row into the table: "Delivery_Issues" */
  insert_Delivery_Issues_one?: Maybe<Delivery_Issues>;
  /** insert data into the table: "Notifications" */
  insert_Notifications?: Maybe<Notifications_Mutation_Response>;
  /** insert a single row into the table: "Notifications" */
  insert_Notifications_one?: Maybe<Notifications>;
  /** insert data into the table: "Order_Items" */
  insert_Order_Items?: Maybe<Order_Items_Mutation_Response>;
  /** insert a single row into the table: "Order_Items" */
  insert_Order_Items_one?: Maybe<Order_Items>;
  /** insert data into the table: "Orders" */
  insert_Orders?: Maybe<Orders_Mutation_Response>;
  /** insert a single row into the table: "Orders" */
  insert_Orders_one?: Maybe<Orders>;
  /** insert data into the table: "Platform_Settings" */
  insert_Platform_Settings?: Maybe<Platform_Settings_Mutation_Response>;
  /** insert a single row into the table: "Platform_Settings" */
  insert_Platform_Settings_one?: Maybe<Platform_Settings>;
  /** insert data into the table: "Products" */
  insert_Products?: Maybe<Products_Mutation_Response>;
  /** insert a single row into the table: "Products" */
  insert_Products_one?: Maybe<Products>;
  /** insert data into the table: "Shopper_Availability" */
  insert_Shopper_Availability?: Maybe<Shopper_Availability_Mutation_Response>;
  /** insert a single row into the table: "Shopper_Availability" */
  insert_Shopper_Availability_one?: Maybe<Shopper_Availability>;
  /** insert data into the table: "Shops" */
  insert_Shops?: Maybe<Shops_Mutation_Response>;
  /** insert a single row into the table: "Shops" */
  insert_Shops_one?: Maybe<Shops>;
  /** insert data into the table: "Users" */
  insert_Users?: Maybe<Users_Mutation_Response>;
  /** insert a single row into the table: "Users" */
  insert_Users_one?: Maybe<Users>;
  /** update data of the table: "Addresses" */
  update_Addresses?: Maybe<Addresses_Mutation_Response>;
  /** update single row of the table: "Addresses" */
  update_Addresses_by_pk?: Maybe<Addresses>;
  /** update multiples rows of table: "Addresses" */
  update_Addresses_many?: Maybe<Array<Maybe<Addresses_Mutation_Response>>>;
  /** update data of the table: "Cart_Items" */
  update_Cart_Items?: Maybe<Cart_Items_Mutation_Response>;
  /** update single row of the table: "Cart_Items" */
  update_Cart_Items_by_pk?: Maybe<Cart_Items>;
  /** update multiples rows of table: "Cart_Items" */
  update_Cart_Items_many?: Maybe<Array<Maybe<Cart_Items_Mutation_Response>>>;
  /** update data of the table: "Carts" */
  update_Carts?: Maybe<Carts_Mutation_Response>;
  /** update single row of the table: "Carts" */
  update_Carts_by_pk?: Maybe<Carts>;
  /** update multiples rows of table: "Carts" */
  update_Carts_many?: Maybe<Array<Maybe<Carts_Mutation_Response>>>;
  /** update data of the table: "Categories" */
  update_Categories?: Maybe<Categories_Mutation_Response>;
  /** update single row of the table: "Categories" */
  update_Categories_by_pk?: Maybe<Categories>;
  /** update multiples rows of table: "Categories" */
  update_Categories_many?: Maybe<Array<Maybe<Categories_Mutation_Response>>>;
  /** update data of the table: "Delivery_Issues" */
  update_Delivery_Issues?: Maybe<Delivery_Issues_Mutation_Response>;
  /** update single row of the table: "Delivery_Issues" */
  update_Delivery_Issues_by_pk?: Maybe<Delivery_Issues>;
  /** update multiples rows of table: "Delivery_Issues" */
  update_Delivery_Issues_many?: Maybe<
    Array<Maybe<Delivery_Issues_Mutation_Response>>
  >;
  /** update data of the table: "Notifications" */
  update_Notifications?: Maybe<Notifications_Mutation_Response>;
  /** update single row of the table: "Notifications" */
  update_Notifications_by_pk?: Maybe<Notifications>;
  /** update multiples rows of table: "Notifications" */
  update_Notifications_many?: Maybe<
    Array<Maybe<Notifications_Mutation_Response>>
  >;
  /** update data of the table: "Order_Items" */
  update_Order_Items?: Maybe<Order_Items_Mutation_Response>;
  /** update single row of the table: "Order_Items" */
  update_Order_Items_by_pk?: Maybe<Order_Items>;
  /** update multiples rows of table: "Order_Items" */
  update_Order_Items_many?: Maybe<Array<Maybe<Order_Items_Mutation_Response>>>;
  /** update data of the table: "Orders" */
  update_Orders?: Maybe<Orders_Mutation_Response>;
  /** update single row of the table: "Orders" */
  update_Orders_by_pk?: Maybe<Orders>;
  /** update multiples rows of table: "Orders" */
  update_Orders_many?: Maybe<Array<Maybe<Orders_Mutation_Response>>>;
  /** update data of the table: "Platform_Settings" */
  update_Platform_Settings?: Maybe<Platform_Settings_Mutation_Response>;
  /** update single row of the table: "Platform_Settings" */
  update_Platform_Settings_by_pk?: Maybe<Platform_Settings>;
  /** update multiples rows of table: "Platform_Settings" */
  update_Platform_Settings_many?: Maybe<
    Array<Maybe<Platform_Settings_Mutation_Response>>
  >;
  /** update data of the table: "Products" */
  update_Products?: Maybe<Products_Mutation_Response>;
  /** update single row of the table: "Products" */
  update_Products_by_pk?: Maybe<Products>;
  /** update multiples rows of table: "Products" */
  update_Products_many?: Maybe<Array<Maybe<Products_Mutation_Response>>>;
  /** update data of the table: "Shopper_Availability" */
  update_Shopper_Availability?: Maybe<Shopper_Availability_Mutation_Response>;
  /** update single row of the table: "Shopper_Availability" */
  update_Shopper_Availability_by_pk?: Maybe<Shopper_Availability>;
  /** update multiples rows of table: "Shopper_Availability" */
  update_Shopper_Availability_many?: Maybe<
    Array<Maybe<Shopper_Availability_Mutation_Response>>
  >;
  /** update data of the table: "Shops" */
  update_Shops?: Maybe<Shops_Mutation_Response>;
  /** update single row of the table: "Shops" */
  update_Shops_by_pk?: Maybe<Shops>;
  /** update multiples rows of table: "Shops" */
  update_Shops_many?: Maybe<Array<Maybe<Shops_Mutation_Response>>>;
  /** update data of the table: "Users" */
  update_Users?: Maybe<Users_Mutation_Response>;
  /** update single row of the table: "Users" */
  update_Users_by_pk?: Maybe<Users>;
  /** update multiples rows of table: "Users" */
  update_Users_many?: Maybe<Array<Maybe<Users_Mutation_Response>>>;
};

/** mutation root */
export type Mutation_RootDelete_AddressesArgs = {
  where: Addresses_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Addresses_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Cart_ItemsArgs = {
  where: Cart_Items_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Cart_Items_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_CartsArgs = {
  where: Carts_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Carts_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_CategoriesArgs = {
  where: Categories_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Categories_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Delivery_IssuesArgs = {
  where: Delivery_Issues_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Delivery_Issues_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_NotificationsArgs = {
  where: Notifications_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Notifications_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Order_ItemsArgs = {
  where: Order_Items_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Order_Items_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_OrdersArgs = {
  where: Orders_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Orders_By_PkArgs = {
  user_id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Platform_SettingsArgs = {
  where: Platform_Settings_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Platform_Settings_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ProductsArgs = {
  where: Products_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Products_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_Shopper_AvailabilityArgs = {
  where: Shopper_Availability_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Shopper_Availability_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_ShopsArgs = {
  where: Shops_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Shops_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootDelete_UsersArgs = {
  where: Users_Bool_Exp;
};

/** mutation root */
export type Mutation_RootDelete_Users_By_PkArgs = {
  id: Scalars["uuid"];
};

/** mutation root */
export type Mutation_RootInsert_AddressesArgs = {
  objects: Array<Addresses_Insert_Input>;
  on_conflict?: InputMaybe<Addresses_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Addresses_OneArgs = {
  object: Addresses_Insert_Input;
  on_conflict?: InputMaybe<Addresses_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Cart_ItemsArgs = {
  objects: Array<Cart_Items_Insert_Input>;
  on_conflict?: InputMaybe<Cart_Items_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Cart_Items_OneArgs = {
  object: Cart_Items_Insert_Input;
  on_conflict?: InputMaybe<Cart_Items_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_CartsArgs = {
  objects: Array<Carts_Insert_Input>;
  on_conflict?: InputMaybe<Carts_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Carts_OneArgs = {
  object: Carts_Insert_Input;
  on_conflict?: InputMaybe<Carts_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_CategoriesArgs = {
  objects: Array<Categories_Insert_Input>;
  on_conflict?: InputMaybe<Categories_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Categories_OneArgs = {
  object: Categories_Insert_Input;
  on_conflict?: InputMaybe<Categories_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Delivery_IssuesArgs = {
  objects: Array<Delivery_Issues_Insert_Input>;
  on_conflict?: InputMaybe<Delivery_Issues_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Delivery_Issues_OneArgs = {
  object: Delivery_Issues_Insert_Input;
  on_conflict?: InputMaybe<Delivery_Issues_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_NotificationsArgs = {
  objects: Array<Notifications_Insert_Input>;
  on_conflict?: InputMaybe<Notifications_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Notifications_OneArgs = {
  object: Notifications_Insert_Input;
  on_conflict?: InputMaybe<Notifications_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Order_ItemsArgs = {
  objects: Array<Order_Items_Insert_Input>;
  on_conflict?: InputMaybe<Order_Items_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Order_Items_OneArgs = {
  object: Order_Items_Insert_Input;
  on_conflict?: InputMaybe<Order_Items_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_OrdersArgs = {
  objects: Array<Orders_Insert_Input>;
  on_conflict?: InputMaybe<Orders_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Orders_OneArgs = {
  object: Orders_Insert_Input;
  on_conflict?: InputMaybe<Orders_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Platform_SettingsArgs = {
  objects: Array<Platform_Settings_Insert_Input>;
  on_conflict?: InputMaybe<Platform_Settings_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Platform_Settings_OneArgs = {
  object: Platform_Settings_Insert_Input;
  on_conflict?: InputMaybe<Platform_Settings_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ProductsArgs = {
  objects: Array<Products_Insert_Input>;
  on_conflict?: InputMaybe<Products_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Products_OneArgs = {
  object: Products_Insert_Input;
  on_conflict?: InputMaybe<Products_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Shopper_AvailabilityArgs = {
  objects: Array<Shopper_Availability_Insert_Input>;
  on_conflict?: InputMaybe<Shopper_Availability_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Shopper_Availability_OneArgs = {
  object: Shopper_Availability_Insert_Input;
  on_conflict?: InputMaybe<Shopper_Availability_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_ShopsArgs = {
  objects: Array<Shops_Insert_Input>;
  on_conflict?: InputMaybe<Shops_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Shops_OneArgs = {
  object: Shops_Insert_Input;
  on_conflict?: InputMaybe<Shops_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_UsersArgs = {
  objects: Array<Users_Insert_Input>;
  on_conflict?: InputMaybe<Users_On_Conflict>;
};

/** mutation root */
export type Mutation_RootInsert_Users_OneArgs = {
  object: Users_Insert_Input;
  on_conflict?: InputMaybe<Users_On_Conflict>;
};

/** mutation root */
export type Mutation_RootUpdate_AddressesArgs = {
  _set?: InputMaybe<Addresses_Set_Input>;
  where: Addresses_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Addresses_By_PkArgs = {
  _set?: InputMaybe<Addresses_Set_Input>;
  pk_columns: Addresses_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Addresses_ManyArgs = {
  updates: Array<Addresses_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Cart_ItemsArgs = {
  _inc?: InputMaybe<Cart_Items_Inc_Input>;
  _set?: InputMaybe<Cart_Items_Set_Input>;
  where: Cart_Items_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Cart_Items_By_PkArgs = {
  _inc?: InputMaybe<Cart_Items_Inc_Input>;
  _set?: InputMaybe<Cart_Items_Set_Input>;
  pk_columns: Cart_Items_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Cart_Items_ManyArgs = {
  updates: Array<Cart_Items_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_CartsArgs = {
  _set?: InputMaybe<Carts_Set_Input>;
  where: Carts_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Carts_By_PkArgs = {
  _set?: InputMaybe<Carts_Set_Input>;
  pk_columns: Carts_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Carts_ManyArgs = {
  updates: Array<Carts_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_CategoriesArgs = {
  _set?: InputMaybe<Categories_Set_Input>;
  where: Categories_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Categories_By_PkArgs = {
  _set?: InputMaybe<Categories_Set_Input>;
  pk_columns: Categories_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Categories_ManyArgs = {
  updates: Array<Categories_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Delivery_IssuesArgs = {
  _set?: InputMaybe<Delivery_Issues_Set_Input>;
  where: Delivery_Issues_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Delivery_Issues_By_PkArgs = {
  _set?: InputMaybe<Delivery_Issues_Set_Input>;
  pk_columns: Delivery_Issues_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Delivery_Issues_ManyArgs = {
  updates: Array<Delivery_Issues_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_NotificationsArgs = {
  _set?: InputMaybe<Notifications_Set_Input>;
  where: Notifications_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Notifications_By_PkArgs = {
  _set?: InputMaybe<Notifications_Set_Input>;
  pk_columns: Notifications_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Notifications_ManyArgs = {
  updates: Array<Notifications_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Order_ItemsArgs = {
  _inc?: InputMaybe<Order_Items_Inc_Input>;
  _set?: InputMaybe<Order_Items_Set_Input>;
  where: Order_Items_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Order_Items_By_PkArgs = {
  _inc?: InputMaybe<Order_Items_Inc_Input>;
  _set?: InputMaybe<Order_Items_Set_Input>;
  pk_columns: Order_Items_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Order_Items_ManyArgs = {
  updates: Array<Order_Items_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_OrdersArgs = {
  _set?: InputMaybe<Orders_Set_Input>;
  where: Orders_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Orders_By_PkArgs = {
  _set?: InputMaybe<Orders_Set_Input>;
  pk_columns: Orders_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Orders_ManyArgs = {
  updates: Array<Orders_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Platform_SettingsArgs = {
  _set?: InputMaybe<Platform_Settings_Set_Input>;
  where: Platform_Settings_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Platform_Settings_By_PkArgs = {
  _set?: InputMaybe<Platform_Settings_Set_Input>;
  pk_columns: Platform_Settings_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Platform_Settings_ManyArgs = {
  updates: Array<Platform_Settings_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_ProductsArgs = {
  _inc?: InputMaybe<Products_Inc_Input>;
  _set?: InputMaybe<Products_Set_Input>;
  where: Products_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Products_By_PkArgs = {
  _inc?: InputMaybe<Products_Inc_Input>;
  _set?: InputMaybe<Products_Set_Input>;
  pk_columns: Products_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Products_ManyArgs = {
  updates: Array<Products_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_Shopper_AvailabilityArgs = {
  _inc?: InputMaybe<Shopper_Availability_Inc_Input>;
  _set?: InputMaybe<Shopper_Availability_Set_Input>;
  where: Shopper_Availability_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Shopper_Availability_By_PkArgs = {
  _inc?: InputMaybe<Shopper_Availability_Inc_Input>;
  _set?: InputMaybe<Shopper_Availability_Set_Input>;
  pk_columns: Shopper_Availability_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Shopper_Availability_ManyArgs = {
  updates: Array<Shopper_Availability_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_ShopsArgs = {
  _set?: InputMaybe<Shops_Set_Input>;
  where: Shops_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Shops_By_PkArgs = {
  _set?: InputMaybe<Shops_Set_Input>;
  pk_columns: Shops_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Shops_ManyArgs = {
  updates: Array<Shops_Updates>;
};

/** mutation root */
export type Mutation_RootUpdate_UsersArgs = {
  _set?: InputMaybe<Users_Set_Input>;
  where: Users_Bool_Exp;
};

/** mutation root */
export type Mutation_RootUpdate_Users_By_PkArgs = {
  _set?: InputMaybe<Users_Set_Input>;
  pk_columns: Users_Pk_Columns_Input;
};

/** mutation root */
export type Mutation_RootUpdate_Users_ManyArgs = {
  updates: Array<Users_Updates>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = "asc",
  /** in ascending order, nulls first */
  AscNullsFirst = "asc_nulls_first",
  /** in ascending order, nulls last */
  AscNullsLast = "asc_nulls_last",
  /** in descending order, nulls first */
  Desc = "desc",
  /** in descending order, nulls first */
  DescNullsFirst = "desc_nulls_first",
  /** in descending order, nulls last */
  DescNullsLast = "desc_nulls_last",
}

export type Query_Root = {
  __typename?: "query_root";
  /** An array relationship */
  Addresses: Array<Addresses>;
  /** An aggregate relationship */
  Addresses_aggregate: Addresses_Aggregate;
  /** fetch data from the table: "Addresses" using primary key columns */
  Addresses_by_pk?: Maybe<Addresses>;
  /** An array relationship */
  Cart_Items: Array<Cart_Items>;
  /** An aggregate relationship */
  Cart_Items_aggregate: Cart_Items_Aggregate;
  /** fetch data from the table: "Cart_Items" using primary key columns */
  Cart_Items_by_pk?: Maybe<Cart_Items>;
  /** An array relationship */
  Carts: Array<Carts>;
  /** An aggregate relationship */
  Carts_aggregate: Carts_Aggregate;
  /** fetch data from the table: "Carts" using primary key columns */
  Carts_by_pk?: Maybe<Carts>;
  /** fetch data from the table: "Categories" */
  Categories: Array<Categories>;
  /** fetch aggregated fields from the table: "Categories" */
  Categories_aggregate: Categories_Aggregate;
  /** fetch data from the table: "Categories" using primary key columns */
  Categories_by_pk?: Maybe<Categories>;
  /** An array relationship */
  Delivery_Issues: Array<Delivery_Issues>;
  /** An aggregate relationship */
  Delivery_Issues_aggregate: Delivery_Issues_Aggregate;
  /** fetch data from the table: "Delivery_Issues" using primary key columns */
  Delivery_Issues_by_pk?: Maybe<Delivery_Issues>;
  /** An array relationship */
  Notifications: Array<Notifications>;
  /** An aggregate relationship */
  Notifications_aggregate: Notifications_Aggregate;
  /** fetch data from the table: "Notifications" using primary key columns */
  Notifications_by_pk?: Maybe<Notifications>;
  /** An array relationship */
  Order_Items: Array<Order_Items>;
  /** An aggregate relationship */
  Order_Items_aggregate: Order_Items_Aggregate;
  /** fetch data from the table: "Order_Items" using primary key columns */
  Order_Items_by_pk?: Maybe<Order_Items>;
  /** An array relationship */
  Orders: Array<Orders>;
  /** An aggregate relationship */
  Orders_aggregate: Orders_Aggregate;
  /** fetch data from the table: "Orders" using primary key columns */
  Orders_by_pk?: Maybe<Orders>;
  /** fetch data from the table: "Platform_Settings" */
  Platform_Settings: Array<Platform_Settings>;
  /** fetch aggregated fields from the table: "Platform_Settings" */
  Platform_Settings_aggregate: Platform_Settings_Aggregate;
  /** fetch data from the table: "Platform_Settings" using primary key columns */
  Platform_Settings_by_pk?: Maybe<Platform_Settings>;
  /** An array relationship */
  Products: Array<Products>;
  /** An aggregate relationship */
  Products_aggregate: Products_Aggregate;
  /** fetch data from the table: "Products" using primary key columns */
  Products_by_pk?: Maybe<Products>;
  /** fetch data from the table: "Shopper_Availability" */
  Shopper_Availability: Array<Shopper_Availability>;
  /** fetch aggregated fields from the table: "Shopper_Availability" */
  Shopper_Availability_aggregate: Shopper_Availability_Aggregate;
  /** fetch data from the table: "Shopper_Availability" using primary key columns */
  Shopper_Availability_by_pk?: Maybe<Shopper_Availability>;
  /** An array relationship */
  Shops: Array<Shops>;
  /** An aggregate relationship */
  Shops_aggregate: Shops_Aggregate;
  /** fetch data from the table: "Shops" using primary key columns */
  Shops_by_pk?: Maybe<Shops>;
  /** fetch data from the table: "Users" */
  Users: Array<Users>;
  /** fetch aggregated fields from the table: "Users" */
  Users_aggregate: Users_Aggregate;
  /** fetch data from the table: "Users" using primary key columns */
  Users_by_pk?: Maybe<Users>;
};

export type Query_RootAddressesArgs = {
  distinct_on?: InputMaybe<Array<Addresses_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Addresses_Order_By>>;
  where?: InputMaybe<Addresses_Bool_Exp>;
};

export type Query_RootAddresses_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Addresses_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Addresses_Order_By>>;
  where?: InputMaybe<Addresses_Bool_Exp>;
};

export type Query_RootAddresses_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootCart_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Cart_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cart_Items_Order_By>>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

export type Query_RootCart_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Cart_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cart_Items_Order_By>>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

export type Query_RootCart_Items_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootCartsArgs = {
  distinct_on?: InputMaybe<Array<Carts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Carts_Order_By>>;
  where?: InputMaybe<Carts_Bool_Exp>;
};

export type Query_RootCarts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Carts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Carts_Order_By>>;
  where?: InputMaybe<Carts_Bool_Exp>;
};

export type Query_RootCarts_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootCategoriesArgs = {
  distinct_on?: InputMaybe<Array<Categories_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Categories_Order_By>>;
  where?: InputMaybe<Categories_Bool_Exp>;
};

export type Query_RootCategories_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Categories_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Categories_Order_By>>;
  where?: InputMaybe<Categories_Bool_Exp>;
};

export type Query_RootCategories_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootDelivery_IssuesArgs = {
  distinct_on?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Delivery_Issues_Order_By>>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

export type Query_RootDelivery_Issues_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Delivery_Issues_Order_By>>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

export type Query_RootDelivery_Issues_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootNotificationsArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Query_RootNotifications_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Query_RootNotifications_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootOrder_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Order_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Order_Items_Order_By>>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

export type Query_RootOrder_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Order_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Order_Items_Order_By>>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

export type Query_RootOrder_Items_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootOrdersArgs = {
  distinct_on?: InputMaybe<Array<Orders_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Orders_Order_By>>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

export type Query_RootOrders_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Orders_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Orders_Order_By>>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

export type Query_RootOrders_By_PkArgs = {
  user_id: Scalars["uuid"];
};

export type Query_RootPlatform_SettingsArgs = {
  distinct_on?: InputMaybe<Array<Platform_Settings_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Platform_Settings_Order_By>>;
  where?: InputMaybe<Platform_Settings_Bool_Exp>;
};

export type Query_RootPlatform_Settings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Platform_Settings_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Platform_Settings_Order_By>>;
  where?: InputMaybe<Platform_Settings_Bool_Exp>;
};

export type Query_RootPlatform_Settings_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootProductsArgs = {
  distinct_on?: InputMaybe<Array<Products_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Products_Order_By>>;
  where?: InputMaybe<Products_Bool_Exp>;
};

export type Query_RootProducts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Products_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Products_Order_By>>;
  where?: InputMaybe<Products_Bool_Exp>;
};

export type Query_RootProducts_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootShopper_AvailabilityArgs = {
  distinct_on?: InputMaybe<Array<Shopper_Availability_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shopper_Availability_Order_By>>;
  where?: InputMaybe<Shopper_Availability_Bool_Exp>;
};

export type Query_RootShopper_Availability_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Shopper_Availability_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shopper_Availability_Order_By>>;
  where?: InputMaybe<Shopper_Availability_Bool_Exp>;
};

export type Query_RootShopper_Availability_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootShopsArgs = {
  distinct_on?: InputMaybe<Array<Shops_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shops_Order_By>>;
  where?: InputMaybe<Shops_Bool_Exp>;
};

export type Query_RootShops_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Shops_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shops_Order_By>>;
  where?: InputMaybe<Shops_Bool_Exp>;
};

export type Query_RootShops_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Query_RootUsersArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

export type Query_RootUsers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

export type Query_RootUsers_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_Root = {
  __typename?: "subscription_root";
  /** An array relationship */
  Addresses: Array<Addresses>;
  /** An aggregate relationship */
  Addresses_aggregate: Addresses_Aggregate;
  /** fetch data from the table: "Addresses" using primary key columns */
  Addresses_by_pk?: Maybe<Addresses>;
  /** fetch data from the table in a streaming manner: "Addresses" */
  Addresses_stream: Array<Addresses>;
  /** An array relationship */
  Cart_Items: Array<Cart_Items>;
  /** An aggregate relationship */
  Cart_Items_aggregate: Cart_Items_Aggregate;
  /** fetch data from the table: "Cart_Items" using primary key columns */
  Cart_Items_by_pk?: Maybe<Cart_Items>;
  /** fetch data from the table in a streaming manner: "Cart_Items" */
  Cart_Items_stream: Array<Cart_Items>;
  /** An array relationship */
  Carts: Array<Carts>;
  /** An aggregate relationship */
  Carts_aggregate: Carts_Aggregate;
  /** fetch data from the table: "Carts" using primary key columns */
  Carts_by_pk?: Maybe<Carts>;
  /** fetch data from the table in a streaming manner: "Carts" */
  Carts_stream: Array<Carts>;
  /** fetch data from the table: "Categories" */
  Categories: Array<Categories>;
  /** fetch aggregated fields from the table: "Categories" */
  Categories_aggregate: Categories_Aggregate;
  /** fetch data from the table: "Categories" using primary key columns */
  Categories_by_pk?: Maybe<Categories>;
  /** fetch data from the table in a streaming manner: "Categories" */
  Categories_stream: Array<Categories>;
  /** An array relationship */
  Delivery_Issues: Array<Delivery_Issues>;
  /** An aggregate relationship */
  Delivery_Issues_aggregate: Delivery_Issues_Aggregate;
  /** fetch data from the table: "Delivery_Issues" using primary key columns */
  Delivery_Issues_by_pk?: Maybe<Delivery_Issues>;
  /** fetch data from the table in a streaming manner: "Delivery_Issues" */
  Delivery_Issues_stream: Array<Delivery_Issues>;
  /** An array relationship */
  Notifications: Array<Notifications>;
  /** An aggregate relationship */
  Notifications_aggregate: Notifications_Aggregate;
  /** fetch data from the table: "Notifications" using primary key columns */
  Notifications_by_pk?: Maybe<Notifications>;
  /** fetch data from the table in a streaming manner: "Notifications" */
  Notifications_stream: Array<Notifications>;
  /** An array relationship */
  Order_Items: Array<Order_Items>;
  /** An aggregate relationship */
  Order_Items_aggregate: Order_Items_Aggregate;
  /** fetch data from the table: "Order_Items" using primary key columns */
  Order_Items_by_pk?: Maybe<Order_Items>;
  /** fetch data from the table in a streaming manner: "Order_Items" */
  Order_Items_stream: Array<Order_Items>;
  /** An array relationship */
  Orders: Array<Orders>;
  /** An aggregate relationship */
  Orders_aggregate: Orders_Aggregate;
  /** fetch data from the table: "Orders" using primary key columns */
  Orders_by_pk?: Maybe<Orders>;
  /** fetch data from the table in a streaming manner: "Orders" */
  Orders_stream: Array<Orders>;
  /** fetch data from the table: "Platform_Settings" */
  Platform_Settings: Array<Platform_Settings>;
  /** fetch aggregated fields from the table: "Platform_Settings" */
  Platform_Settings_aggregate: Platform_Settings_Aggregate;
  /** fetch data from the table: "Platform_Settings" using primary key columns */
  Platform_Settings_by_pk?: Maybe<Platform_Settings>;
  /** fetch data from the table in a streaming manner: "Platform_Settings" */
  Platform_Settings_stream: Array<Platform_Settings>;
  /** An array relationship */
  Products: Array<Products>;
  /** An aggregate relationship */
  Products_aggregate: Products_Aggregate;
  /** fetch data from the table: "Products" using primary key columns */
  Products_by_pk?: Maybe<Products>;
  /** fetch data from the table in a streaming manner: "Products" */
  Products_stream: Array<Products>;
  /** fetch data from the table: "Shopper_Availability" */
  Shopper_Availability: Array<Shopper_Availability>;
  /** fetch aggregated fields from the table: "Shopper_Availability" */
  Shopper_Availability_aggregate: Shopper_Availability_Aggregate;
  /** fetch data from the table: "Shopper_Availability" using primary key columns */
  Shopper_Availability_by_pk?: Maybe<Shopper_Availability>;
  /** fetch data from the table in a streaming manner: "Shopper_Availability" */
  Shopper_Availability_stream: Array<Shopper_Availability>;
  /** An array relationship */
  Shops: Array<Shops>;
  /** An aggregate relationship */
  Shops_aggregate: Shops_Aggregate;
  /** fetch data from the table: "Shops" using primary key columns */
  Shops_by_pk?: Maybe<Shops>;
  /** fetch data from the table in a streaming manner: "Shops" */
  Shops_stream: Array<Shops>;
  /** fetch data from the table: "Users" */
  Users: Array<Users>;
  /** fetch aggregated fields from the table: "Users" */
  Users_aggregate: Users_Aggregate;
  /** fetch data from the table: "Users" using primary key columns */
  Users_by_pk?: Maybe<Users>;
  /** fetch data from the table in a streaming manner: "Users" */
  Users_stream: Array<Users>;
};

export type Subscription_RootAddressesArgs = {
  distinct_on?: InputMaybe<Array<Addresses_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Addresses_Order_By>>;
  where?: InputMaybe<Addresses_Bool_Exp>;
};

export type Subscription_RootAddresses_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Addresses_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Addresses_Order_By>>;
  where?: InputMaybe<Addresses_Bool_Exp>;
};

export type Subscription_RootAddresses_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootAddresses_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Addresses_Stream_Cursor_Input>>;
  where?: InputMaybe<Addresses_Bool_Exp>;
};

export type Subscription_RootCart_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Cart_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cart_Items_Order_By>>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

export type Subscription_RootCart_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Cart_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Cart_Items_Order_By>>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

export type Subscription_RootCart_Items_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootCart_Items_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Cart_Items_Stream_Cursor_Input>>;
  where?: InputMaybe<Cart_Items_Bool_Exp>;
};

export type Subscription_RootCartsArgs = {
  distinct_on?: InputMaybe<Array<Carts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Carts_Order_By>>;
  where?: InputMaybe<Carts_Bool_Exp>;
};

export type Subscription_RootCarts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Carts_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Carts_Order_By>>;
  where?: InputMaybe<Carts_Bool_Exp>;
};

export type Subscription_RootCarts_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootCarts_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Carts_Stream_Cursor_Input>>;
  where?: InputMaybe<Carts_Bool_Exp>;
};

export type Subscription_RootCategoriesArgs = {
  distinct_on?: InputMaybe<Array<Categories_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Categories_Order_By>>;
  where?: InputMaybe<Categories_Bool_Exp>;
};

export type Subscription_RootCategories_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Categories_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Categories_Order_By>>;
  where?: InputMaybe<Categories_Bool_Exp>;
};

export type Subscription_RootCategories_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootCategories_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Categories_Stream_Cursor_Input>>;
  where?: InputMaybe<Categories_Bool_Exp>;
};

export type Subscription_RootDelivery_IssuesArgs = {
  distinct_on?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Delivery_Issues_Order_By>>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

export type Subscription_RootDelivery_Issues_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Delivery_Issues_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Delivery_Issues_Order_By>>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

export type Subscription_RootDelivery_Issues_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootDelivery_Issues_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Delivery_Issues_Stream_Cursor_Input>>;
  where?: InputMaybe<Delivery_Issues_Bool_Exp>;
};

export type Subscription_RootNotificationsArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Subscription_RootNotifications_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Notifications_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Notifications_Order_By>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Subscription_RootNotifications_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootNotifications_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Notifications_Stream_Cursor_Input>>;
  where?: InputMaybe<Notifications_Bool_Exp>;
};

export type Subscription_RootOrder_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Order_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Order_Items_Order_By>>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

export type Subscription_RootOrder_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Order_Items_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Order_Items_Order_By>>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

export type Subscription_RootOrder_Items_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootOrder_Items_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Order_Items_Stream_Cursor_Input>>;
  where?: InputMaybe<Order_Items_Bool_Exp>;
};

export type Subscription_RootOrdersArgs = {
  distinct_on?: InputMaybe<Array<Orders_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Orders_Order_By>>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

export type Subscription_RootOrders_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Orders_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Orders_Order_By>>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

export type Subscription_RootOrders_By_PkArgs = {
  user_id: Scalars["uuid"];
};

export type Subscription_RootOrders_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Orders_Stream_Cursor_Input>>;
  where?: InputMaybe<Orders_Bool_Exp>;
};

export type Subscription_RootPlatform_SettingsArgs = {
  distinct_on?: InputMaybe<Array<Platform_Settings_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Platform_Settings_Order_By>>;
  where?: InputMaybe<Platform_Settings_Bool_Exp>;
};

export type Subscription_RootPlatform_Settings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Platform_Settings_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Platform_Settings_Order_By>>;
  where?: InputMaybe<Platform_Settings_Bool_Exp>;
};

export type Subscription_RootPlatform_Settings_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootPlatform_Settings_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Platform_Settings_Stream_Cursor_Input>>;
  where?: InputMaybe<Platform_Settings_Bool_Exp>;
};

export type Subscription_RootProductsArgs = {
  distinct_on?: InputMaybe<Array<Products_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Products_Order_By>>;
  where?: InputMaybe<Products_Bool_Exp>;
};

export type Subscription_RootProducts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Products_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Products_Order_By>>;
  where?: InputMaybe<Products_Bool_Exp>;
};

export type Subscription_RootProducts_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootProducts_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Products_Stream_Cursor_Input>>;
  where?: InputMaybe<Products_Bool_Exp>;
};

export type Subscription_RootShopper_AvailabilityArgs = {
  distinct_on?: InputMaybe<Array<Shopper_Availability_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shopper_Availability_Order_By>>;
  where?: InputMaybe<Shopper_Availability_Bool_Exp>;
};

export type Subscription_RootShopper_Availability_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Shopper_Availability_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shopper_Availability_Order_By>>;
  where?: InputMaybe<Shopper_Availability_Bool_Exp>;
};

export type Subscription_RootShopper_Availability_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootShopper_Availability_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Shopper_Availability_Stream_Cursor_Input>>;
  where?: InputMaybe<Shopper_Availability_Bool_Exp>;
};

export type Subscription_RootShopsArgs = {
  distinct_on?: InputMaybe<Array<Shops_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shops_Order_By>>;
  where?: InputMaybe<Shops_Bool_Exp>;
};

export type Subscription_RootShops_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Shops_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Shops_Order_By>>;
  where?: InputMaybe<Shops_Bool_Exp>;
};

export type Subscription_RootShops_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootShops_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Shops_Stream_Cursor_Input>>;
  where?: InputMaybe<Shops_Bool_Exp>;
};

export type Subscription_RootUsersArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

export type Subscription_RootUsers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

export type Subscription_RootUsers_By_PkArgs = {
  id: Scalars["uuid"];
};

export type Subscription_RootUsers_StreamArgs = {
  batch_size: Scalars["Int"];
  cursor: Array<InputMaybe<Users_Stream_Cursor_Input>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["timestamptz"]>;
  _gt?: InputMaybe<Scalars["timestamptz"]>;
  _gte?: InputMaybe<Scalars["timestamptz"]>;
  _in?: InputMaybe<Array<Scalars["timestamptz"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["timestamptz"]>;
  _lte?: InputMaybe<Scalars["timestamptz"]>;
  _neq?: InputMaybe<Scalars["timestamptz"]>;
  _nin?: InputMaybe<Array<Scalars["timestamptz"]>>;
};

/** Boolean expression to compare columns of type "timetz". All fields are combined with logical 'AND'. */
export type Timetz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["timetz"]>;
  _gt?: InputMaybe<Scalars["timetz"]>;
  _gte?: InputMaybe<Scalars["timetz"]>;
  _in?: InputMaybe<Array<Scalars["timetz"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["timetz"]>;
  _lte?: InputMaybe<Scalars["timetz"]>;
  _neq?: InputMaybe<Scalars["timetz"]>;
  _nin?: InputMaybe<Array<Scalars["timetz"]>>;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: InputMaybe<Scalars["uuid"]>;
  _gt?: InputMaybe<Scalars["uuid"]>;
  _gte?: InputMaybe<Scalars["uuid"]>;
  _in?: InputMaybe<Array<Scalars["uuid"]>>;
  _is_null?: InputMaybe<Scalars["Boolean"]>;
  _lt?: InputMaybe<Scalars["uuid"]>;
  _lte?: InputMaybe<Scalars["uuid"]>;
  _neq?: InputMaybe<Scalars["uuid"]>;
  _nin?: InputMaybe<Array<Scalars["uuid"]>>;
};

export type GetUsersQueryVariables = Exact<{ [key: string]: never }>;

export type GetUsersQuery = {
  __typename?: "query_root";
  Users: Array<{ __typename?: "Users"; id: any }>;
};

export const GetUsersDocument = `
    query GetUsers {
  Users {
    id
  }
}
    `;
export const useGetUsersQuery = <TData = GetUsersQuery, TError = unknown>(
  variables?: GetUsersQueryVariables,
  options?: UseQueryOptions<GetUsersQuery, TError, TData>
) =>
  useQuery<GetUsersQuery, TError, TData>(
    variables === undefined ? ["GetUsers"] : ["GetUsers", variables],
    fetcher<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, variables),
    options
  );

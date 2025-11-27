-- Migration: Create emissions table
-- Date: 2024-11-26

CREATE TABLE IF NOT EXISTS "emissions" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL,
    "source" character varying NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "date" DATE NOT NULL,
    "offset" numeric(10,2) NOT NULL DEFAULT 0,
    "offset_project_id" uuid,
    "offset_request_id" character varying,
    "description" text,
    "category" character varying,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_emissions" PRIMARY KEY ("id"),
    CONSTRAINT "FK_emissions_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "FK_emissions_projects" FOREIGN KEY ("offset_project_id") REFERENCES "tokenized_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS "IDX_emissions_user_id" ON "emissions" ("user_id");

-- Create index on date for faster date-based queries
CREATE INDEX IF NOT EXISTS "IDX_emissions_date" ON "emissions" ("date");


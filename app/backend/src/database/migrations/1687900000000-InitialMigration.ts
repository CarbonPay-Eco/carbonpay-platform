import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1687900000000 implements MigrationInterface {
    name = 'InitialMigration1687900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create wallets table
        await queryRunner.query(`
            CREATE TABLE "wallets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "wallet_address" character varying NOT NULL,
                "provider" character varying,
                "role" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_wallets_wallet_address" UNIQUE ("wallet_address"),
                CONSTRAINT "PK_wallets" PRIMARY KEY ("id")
            )
        `);

        // Create organizations table
        await queryRunner.query(`
            CREATE TABLE "organizations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "wallet_id" uuid NOT NULL,
                "company_name" character varying NOT NULL,
                "country" character varying NOT NULL,
                "registration_number" character varying,
                "industry_type" character varying,
                "company_size" character varying,
                "description" character varying,
                "tracks_emissions" boolean NOT NULL DEFAULT false,
                "emission_sources" text,
                "sustainability_certifications" text,
                "prior_offsetting" boolean NOT NULL DEFAULT false,
                "contact_email" character varying,
                "website_url" character varying,
                "accepted_terms" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_organizations" PRIMARY KEY ("id"),
                CONSTRAINT "REL_organizations_wallet_id" UNIQUE ("wallet_id"),
                CONSTRAINT "FK_organizations_wallets" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Create tokenized_projects table
        await queryRunner.query(`
            CREATE TABLE "tokenized_projects" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "token_id" character varying NOT NULL,
                "project_name" character varying NOT NULL,
                "location" character varying NOT NULL,
                "description" character varying NOT NULL,
                "certification_body" character varying NOT NULL,
                "project_ref_id" character varying NOT NULL,
                "methodology" character varying NOT NULL,
                "verifier_name" character varying NOT NULL,
                "vintage_year" integer NOT NULL,
                "total_issued" integer NOT NULL,
                "available" integer NOT NULL,
                "price_per_ton" numeric(10,2) NOT NULL,
                "ipfs_hash" character varying NOT NULL,
                "documentation_url" character varying,
                "on_chain_mint_tx" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'available',
                "project_image_url" character varying,
                "tags" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_tokenized_projects_token_id" UNIQUE ("token_id"),
                CONSTRAINT "PK_tokenized_projects" PRIMARY KEY ("id")
            )
        `);

        // Create retirements table
        await queryRunner.query(`
            CREATE TABLE "retirements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "wallet_id" uuid NOT NULL,
                "tokenized_project_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "retirement_date" TIMESTAMP NOT NULL DEFAULT now(),
                "tx_hash" character varying NOT NULL,
                "proof_url" character varying,
                "auto_offset" boolean NOT NULL DEFAULT false,
                "reporting_period_start" DATE,
                "reporting_period_end" DATE,
                CONSTRAINT "PK_retirements" PRIMARY KEY ("id"),
                CONSTRAINT "FK_retirements_wallets" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_retirements_tokenized_projects" FOREIGN KEY ("tokenized_project_id") REFERENCES "tokenized_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Create audit_logs table
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "wallet_id" uuid NOT NULL,
                "action" character varying NOT NULL,
                "entity_type" character varying NOT NULL,
                "entity_id" uuid,
                "metadata" jsonb,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
                CONSTRAINT "FK_audit_logs_wallets" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Create uuid extension if not exists
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "retirements"`);
        await queryRunner.query(`DROP TABLE "tokenized_projects"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
    }
} 
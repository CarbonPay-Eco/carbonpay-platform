// use anchor_lang::prelude::*;
// use anchor_spl::{
//     token::{ Mint, Token, TokenAccount, MintTo},
//     associated_token::AssociatedToken,
//     metadata:: Metadata,
// };

// #[derive(Accounts)]
// pub struct MintNFT<'info> {
//     #[account(mut)]
//     pub user: Signer<'info>,
//     #[account(
//         init,
//         payer = user,
//         mint::decimals = 0,
//         mint::authority = user,
//         mint::freeze_authority = user,
//     )]
//     pub mint: Account<'info, Mint>,
//     #[account(
//         init,
//         payer = user,
//         associated_token::mint = mint,
//         associated_token::authority = user,
//     )]
//     pub user_token_account: Account<'info, TokenAccount>,
//     #[account(mut)]
//     pub metadata: AccountInfo<'info>, /// CHECK; This account will be initialized by the Token Metadata program
//     pub collection_mint: Account<'info, Mint>, /// CHECK; This account will be initialized by the Token Metadata program
//     #[account(mut)]
//     pub master_edition: AccountInfo<'info>,
//     pub system_program: Program<'info, System>,
//     pub token_program: Program<'info, Token>,
//     pub associated_token_program: Program<'info, AssociatedToken>,
//     pub token_metadata_program: Program<'info, Metadata>,
// }

// impl<'info> MintNFT<'info> {
//     pub fn mint_nft(&mut self, uri: String, name: String) -> Result<()> {
//         self.mint_token()?;
//         self.create_metadata(uri, name)?;
//         self.create_master_edition()
//     }

//     pub fn mint_token(&mut self) -> Result<()> {
//         let cpi_program = self.token_program.to_account_info();

//         let cpi_accounts = MintTo {
//             mint: self.mint.to_account_info(),
//             to: self.user_token_account.to_account_info(),
//             authority: self.user.to_account_info(),
//         };

//         let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

//         mint_to(cpi_ctx, 1)
//     }

//     pub fn create_metadata(&mut self, uri: String, name: String) -> Result<()> {
//         let metadata: &AccountInfo<'_> = &self.metadata.to_account_info();
//         let mint: &AccountInfo<'_> = &self.mint.to_account_info();
//         let mint_authority: &AccountInfo<'_> = &self.user.to_account_info();
//         let payer: &AccountInfo<'_> = &self.user.to_account_info();
//         let update_authority: &AccountInfo<'_> = &self.user.to_account_info();
//         let system_program: &AccountInfo<'_> = &self.system_program.to_account_info();
//         let token_metadata_program: &AccountInfo<'_> = &self.token_metadata_program.to_account_info();

//         CreateMetadataAccountV3Cpi::new(
//             token_metadata_program,
//             CreateMetadataAccountV3CpiAccounts {
//                 metadata,
//                 mint,
//                 mint_authority,
//                 update_authority: (update_authority, true),
//                 payer,
//                 system_program,
//                 rent: None,
//             },
//             CreateMetadataAccountV3InstructionArgs {
//                 data: DataV2 {
//                     name,
//                     symbol: "NFT".to_owned(),
//                     uri,
//                     seller_fee_basis_points: 200,
//                     creators: Some(vec![Creator {
//                         address: self.user.key(),
//                         verified: true,
//                         share: 100,
//                     }]),
//                     collection: Some(Collection {
//                         key: self.collection_mint.key(),
//                         verified: false,
//                     }),
//                     uses: None,
//                 },
//                 is_mutable: true,
//                 collection_details: None,
//             },
//         )
//         .invoke()?;

//         Ok(())
//     }

//     pub fn create_master_edition(&mut self) -> Result<()> {
//         let metadata = &self.metadata.to_account_info();
//         let master_edition = &self.master_edition.to_account_info();
//         let mint = &self.mint.to_account_info();
//         let mint_authority = &self.user.to_account_info();
//         let payer = &self.user.to_account_info();
//         let update_authority = &self.user.to_account_info();
//         let system_program = &self.system_program.to_account_info();
//         let token_program = &self.token_program.to_account_info();
//         let token_metadata_program = &self.token_metadata_program.to_account_info();

//         CreateMasterEditionV3Cpi::new(
//             token_metadata_program,
//             CreateMasterEditionV3CpiAccounts {
//                 edition: master_edition,
//                 mint,
//                 update_authority,
//                 mint_authority,
//                 payer,
//                 metadata,
//                 token_program,
//                 system_program,
//                 rent: None,
//             },
//             CreateMasterEditionV3InstructionArgs {
//                 max_supply: Some(0),
//             },
//         )
//         .invoke()?;

//         Ok(())
//     }
// }
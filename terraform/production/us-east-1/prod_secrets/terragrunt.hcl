locals {
  tg_module          = "modules/aws_secret"
  deploy_region_vars = read_terragrunt_config(find_in_parent_folders("deploy_region.hcl"))
  deploy_env_vars    = read_terragrunt_config(find_in_parent_folders("deploy_env.hcl"))

  region = local.deploy_region_vars.locals.region
  name   = "${local.deploy_env_vars.locals.environment}-mcp-server-repliers-secrets"
  tags = {
    "environment" = local.deploy_env_vars.locals.environment
    "region"      = local.deploy_region_vars.locals.region
    "Name"        = local.name
  }
}

terraform {
  source = "${local.deploy_env_vars.locals.tg_module_source}//${local.tg_module}"
}

include {
  path = find_in_parent_folders()
}

inputs = {
  region = local.region
  secret_names = [
    "aws_secret_access_key",
    "repliers_api_key",
    "mcp_api_key"
  ]
  tags = local.tags
}

include {
  path = find_in_parent_folders()
}

dependency "secrets" {
  config_path                             = "../dev_secrets"
  mock_outputs_allowed_terraform_commands = ["init", "validate"]
  mock_outputs = {
    secrets = "mock_secrets"
  }
}

locals {
  tg_module          = "modules/aws_ecs_service"
  deploy_region_vars = read_terragrunt_config(find_in_parent_folders("deploy_region.hcl"))
  deploy_env_vars    = read_terragrunt_config(find_in_parent_folders("deploy_env.hcl"))
  git_hash           = get_env("GIT_HASH", "ca443bc86904ee38021a046a81581c1103e33ddb")

  region           = local.deploy_region_vars.locals.region
  name             = "${local.deploy_env_vars.locals.environment}-mave-mcp-server-repliers"
  cluster_name     = local.deploy_env_vars.locals.cluster_name
  sc_namespace_arn = local.deploy_env_vars.locals.sc_namespace_arn
  tags = {
    "Environment" = local.deploy_env_vars.locals.environment
    "Region"      = local.deploy_region_vars.locals.region
    "Name"        = local.name
  }
}

terraform {
  source = "${local.deploy_env_vars.locals.tg_module_source}//${local.tg_module}"
  #source = "../../../../../infrastructure/modules/aws_ecs_service"
}

inputs = {
  sc_namespace_arn            = local.deploy_env_vars.locals.sc_namespace_arn
  service_port_name           = "${local.name}-port"
  cluster_name                = local.cluster_name
  region                      = local.region
  name                        = local.name
  alb_enabled                 = false
  domain_name                 = "mcp-repliers.maveai-dev.co"
  internal                    = false
  load_balancer_type          = "application"
  security_group_ids          = [local.deploy_env_vars.locals.sg_id]
  subnet_ids                  = [local.deploy_env_vars.locals.subnet_1a_id, local.deploy_env_vars.locals.subnet_1b_id]
  vpc_id                      = local.deploy_env_vars.locals.vpc_id
  hosted_zone_id              = "Z00131081V3NAGYID3SCW"
  lb_idle_timeout             = 360
  tags                        = local.tags
  cpu                         = "512"
  memory                      = "1024"
  network_mode                = "awsvpc"
  launch_type                 = "FARGATE"
  requires_compatibilities    = ["FARGATE"]
  idle_timeout_seconds        = 180
  per_request_timeout_seconds = 150

  ### Autoscaling parameters
  # The maximum number of tasks the service can scale up to
  autoscaling_max_count = 3
  # Target average CPU usage (70%); scaling adds tasks if this limit is exceeded
  autoscaling_cpu_target_value = 70.0
  # Seconds to wait after a scale-in (removal) before another scale-in can occur
  autoscaling_cpu_scale_in_cooldown_seconds = 300
  # Seconds to wait after a scale-out (addition) before another scale-out can occur
  autoscaling_cpu_scale_out_cooldown_seconds = 60
  # Target average Memory usage (70%); scaling adds tasks if this limit is exceeded
  autoscaling_memory_target_value = 70.0
  # Seconds to wait after a memory-based scale-in before the next scale-in
  autoscaling_memory_scale_in_cooldown_seconds = 300
  # Seconds to wait after a memory-based scale-out before the next scale-out
  autoscaling_memory_scale_out_cooldown_seconds = 60

  container_definitions = jsonencode([
    {
      name        = "server"
      image       = "471112786452.dkr.ecr.us-east-1.amazonaws.com/mcp-server-repliers:${local.git_hash}"
      essential   = true
      cpu         = 512
      memory      = 1024
      command     = ["node", "mcpServer.js", "--http"]
      environment = [{ name = "PORT", value = "8080" }]
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "wget -qO- http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])
  operating_system_family = "LINUX"
  cpu_architecture        = "X86_64"
  desired_count           = 1
  container_name          = "server"
  container_port          = 8080
  common_environment_variables = [
    {
      name  = "AWS_ACCESS_KEY_ID"
      value = "AKIAW3MECUIKD5WWXI4V"
    },
    {
      name  = "AWS_SECRET_ACCESS_KEY"
      value = dependency.secrets.outputs.secret_values.aws_secret_access_key
    },
    {
      name  = "BASE_URL"
      value = "http://dev-mave-mcp-server-repliers:8080"
    },
    {
      name  = "REPLIERS_API_KEY"
      value = dependency.secrets.outputs.secret_values.repliers_api_key
    },
    #{
    #  name  = "MCP_API_KEY"
    #  value = dependency.secrets.outputs.secret_values.mcp_api_key
    #}
  ]
}

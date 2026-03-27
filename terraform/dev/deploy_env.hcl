locals {
  environment      = "dev"
  sg_id            = "sg-084af9e0e6a63c8d3"
  subnet_1a_id     = "subnet-06b97aa79f956eaf5"
  subnet_1b_id     = "subnet-0869b44562d0f054f"
  vpc_id           = "vpc-0e637736ee0637523"
  cluster_name     = "dev-mave-api-cluster"
  sc_namespace_arn = "arn:aws:servicediscovery:us-east-1:471112786452:namespace/ns-gxnln2w42c7ihr3u"
  tg_module_source = get_env("TG_MODULE_SOURCE", "git::https://github.com/mave-tech/infrastructure.git")
  }

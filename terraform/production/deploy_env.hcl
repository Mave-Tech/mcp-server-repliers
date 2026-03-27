locals {
  environment      = "production"
  sg_id            = "sg-0de448f5b8cb47ae2"
  subnet_1a_id     = "subnet-0efa12128846a6c8b"
  subnet_1b_id     = "subnet-04a1238b3ae994085"
  vpc_id           = "vpc-03c0933664c0dd070"
  cluster_name     = "production-mave-api-cluster"
  sc_namespace_arn = "arn:aws:servicediscovery:us-east-1:471112786452:namespace/ns-agnaximmyfueh42r"
  tg_module_source = get_env("TG_MODULE_SOURCE", "git::https://github.com/mave-tech/infrastructure.git")
  }

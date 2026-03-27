remote_state {
  backend = "s3"
  config = {
    bucket  = "mave-terraform-state"
    key     = "${path_relative_to_include()}/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
    profile = "mave"
  }
}

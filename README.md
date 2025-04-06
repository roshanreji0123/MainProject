    docker build -t mainproject .
        
    docker run -it --rm --env-file ./.env -p 5000:5000 -v "$((Get-Location).Path -replace '\\', '/')/pdf:/app/pdf" -v "$((Get-Location).Path -replace '\\', '/')/images:/app/images" mainproject
    http://localhost:5000/

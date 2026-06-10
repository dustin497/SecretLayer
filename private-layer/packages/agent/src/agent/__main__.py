import sys

if len(sys.argv) > 1 and sys.argv[1] == "serve":
    from .server import main

    main()
else:
    print("Usage: python -m agent serve")

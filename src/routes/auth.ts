router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { user, token } = await AuthService.register(email, password);

    // Buscar a wallet do usuário
    const walletRepository =
      require("../database/data-source").AppDataSource.getRepository(
        require("../entities/Wallet").Wallet
      );
    const wallet = await walletRepository.findOneBy({ userId: user.id });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        publicKey: wallet?.publicKey || null,
      },
      token,
    });
  } catch (error) {
    if (error.message === "User already exists") {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { user, token } = await AuthService.login(email, password);

    // Buscar a wallet do usuário
    const walletRepository =
      require("../database/data-source").AppDataSource.getRepository(
        require("../entities/Wallet").Wallet
      );
    const wallet = await walletRepository.findOneBy({ userId: user.id });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        publicKey: wallet?.publicKey || null,
      },
      token,
    });
  } catch (error) {
    if (
      error.message === "User not found" ||
      error.message === "Invalid password"
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

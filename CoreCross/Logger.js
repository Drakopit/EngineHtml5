export class Logger {
	static logRequest(url, init = {}, response, duration) {
		const isError = response && !response.ok;
		const emoji = isError ? '❌' : '✅';

		console.log(`\n${'='.repeat(20)} API REQUEST ${'='.repeat(20)}`);
		console.log(`📡 [${init.method || 'GET'}] ${url}`);

		if (init.body) {
			try {
				const bodyObj = JSON.parse(init.body);
				console.log('📦 BODY ENVIADO:');
				console.log(JSON.stringify(bodyObj, null, 2));
			} catch {
				console.log('📦 BODY:', init.body);
			}
		}

		if (response) {
			console.log(`\n${'-'.repeat(15)} RESPONSE (${duration}ms) ${'-'.repeat(15)}`);
			console.log(`${emoji} STATUS: ${response.status}`);

			if (response.data) {
				console.log('📄 DATA:');
				console.log(JSON.stringify(response.data, null, 2));
			}
		}

		console.log(`${'='.repeat(53)}\n`);
	}

	// 🔥 Log generalista em JS puro
	static log(level, message, data) {
		const levels = {
			info: { label: 'INFO', emoji: 'ℹ️' },
			warn: { label: 'WARN', emoji: '⚠️' },
			error: { label: 'ERROR', emoji: '❌' },
			debug: { label: 'DEBUG', emoji: '🐞' },
		};

		const config = levels[level] || levels.info;

		console.log(`\n${'-'.repeat(15)} ${config.emoji} ${config.label} ${'-'.repeat(15)}`);
		console.log(`🕒 ${new Date().toISOString()}`);
		console.log(`📌 ${message}`);

		if (data !== undefined) {
			console.log('📎 DATA:');
			// Se for um objeto (e não nulo), use o console.dir para manter a interatividade do DevTools!
			if (typeof data === 'object' && data !== null) {
				console.dir(data, { depth: null });
			} else {
				console.log(data);
			}
		}

		console.log(`${'-'.repeat(45)}\n`);
	}
}
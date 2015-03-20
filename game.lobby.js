function Lobby(master, maximum_players, master_peer_id)
{
	this.my_player_number = 0;
	this.connections = [];
	this.masterNode = master;
	this.callbacks = [];
	var self = this;
	var maximum_players = maximum_players;
	this.init = function()
	{
		this.peer = new Peer({key: peerjs_api_key});
		this.peer.on('open', function(myid)
		{
			self.id = myid;
			if (!master)
			{
				self.connect(master_peer_id);
			}
			if (self.callbacks['init'] !== undefined)
				self.callbacks['init']();
		});
		this.peer.on('connection', function(conn)
		{
			conn.on('open', function()
			{
				if (self.masterNode)
				{
					if (self.connections.length > maximum_players)
					{
						if (self.callbacks['overflow'] !== undefined)
							self.callbacks['overflow'](conn);
					}
					else
					{
						self.connections.push({dataConnection: conn, id: conn.peer, updated: false});
						self.connections[conn.peer] = {dataConnection: conn, id: conn.peer, updated: false};
						self.callbacks['new_player'](conn);
						conn.on('data',function(data)
						{
							if (self.callbacks['data'] !== undefined)
								self.callbacks['data'](conn,data);
						});
						if (self.connections.length > maximum_players)
						{
							if (self.callbacks['full'] !== undefined)
								self.callbacks['full'](conn);
						}
					}
				}
			})
		});
	}
	this.connect = function(id)
	{
		var conn = this.peer.connect(id);
		conn.on('open', function()
		{
			if (!self.masterNode)
			{
				self.connections.push({dataConnection: conn, id: conn.peer, updated: false});
				self.connections[conn.peer] = {dataConnection: conn, id: conn.peer, updated: false};
				conn.on('data',function(data)
				{
					if (self.callbacks['data'] !== undefined)
						self.callbacks['data'](conn,data);
				});
			}
		});
	};
	this.broadcast = function(data)
	{
		if (this.masterNode)
		{
			for(var i = 0; i < this.connections.length; i++)
			{
				if (i !== this.id)
				{
					this.connections[i].dataConnection.send(data);
				}
			}
		}
	};
	this.send = function(message, destination_peer)
	{
		if (destination_peer === undefined) //assume master is destination
		{
			destination_peer = master_peer_id;
		}
		this.connections[destination_peer].dataConnection.send(message);
	}
	this.on = function(event, callback)
	{
		this.callbacks[event] = callback;
	};
}
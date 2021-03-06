//require('amd-loader')
var	csv
=	require('csv')
,	_
=	require('underscore')
,	path
=	require('path')
,	fs
=	require('fs')
,	fsExists
=	fs.existsSync || path.existsSync
,	program
=	require('commander')
		.version('0.0.1')
		.option('-i, --input <path>','input dir for csv data [./data/csv]',String,'./data/csv')
		.option('-o, --output <path>','output dir for json data [./data/json]',String,'./data/json')
		.option('-m, --mappings <mappings.json>','text to csv parsing mappings  [./mappings.json]',String,'./mappings.json')
		.parse(process.argv)
,	ensureDir
=	require('ensureDir')
,	mappings
=	fsExists(program.mappings)
		?require(program.mappings)
		:false
,	Log
=	require('log-color')
,	logger
=	new Log(
		{
			level:	'debug'
		,	color:	true
		}
	)
if(!fsExists(program.input))
	logger.error('Program Input: no such file'+program.input)
if(!mappings)
	logger.error('Program Mappings: no such file'+program.mappings)
logger.info('Program Input: '+program.input)
logger.info('Program Mappings: '+program.mappings)
ensureDir(
	program.output
,	function()
	{
		logger.info('Program Output: '+program.output)
	var	sources
	=	{}
	,	buffer
	=	[]
		_.each(
			mappings
		,	function(mapping,index)
			{
			var	counter
			=	0
				sources[index]
				=	{
						csv:
							csv()
							.from.path(
								program.input+'/'+index+'.csv'
							,	{
									header:true
								,	columns:mapping.fields
								}
							)
							.transform(
								function(record)
								{
									record
									=	_(record)
										.omit(
											_(
												_(record)
												.keys()
											).filter(
												function(k)
												{
													return	_.first(k)=='_'
												}
											)
										)
									_.each(
										_.keys(record)
									,	function(key)
										{
											if	(!_.isNaN(parseFloat(record[key])))
												record[key]
												=	parseFloat(record[key])
											if	(_.isEqual(record[key],"true") || _.isEqual(record[key],"false"))
												record[key]
												=	_.isEqual(record[key],"true")
										}
									)
									if(!record.id)
										record.id=counter++
									if(!buffer[index])
										buffer[index]=[]
									else
										buffer[index].push( record )
								return	null
								}
							)
					}
			}
		)
		_(sources)
		.each(
			function(source,index)
			{
			var	out
			=	fs.createWriteStream(program.output+'/'+index+'.json')
				logger.info('Processing: '+index)
				source.csv
				.on(
					'end'
				,	function()
					{
						out.write(
							JSON.stringify(
								buffer[index]
							)
						)
						out.end()
					}
				)
			}
		)
	}
)
